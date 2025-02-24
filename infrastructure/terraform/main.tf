# Configure Terraform and required providers
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    # Backend configuration should be provided via backend config file
    key = "urban-gardening/terraform.tfstate"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables
locals {
  common_tags = {
    Project     = "Urban Gardening Assistant"
    Environment = var.environment
    ManagedBy   = "Terraform"
    LastUpdated = timestamp()
    CostCenter  = "Urban-Garden-${var.environment}"
  }
}

# VPC Module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "urban-garden-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnets  = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.vpc_cidr, 4, i + length(data.aws_availability_zones.available.names))]

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "prod"
  enable_dns_hostnames   = true
  enable_dns_support     = true
  enable_vpn_gateway     = false
  enable_ipv6           = false

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true

  tags = merge(local.common_tags, {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = "1.27"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  node_groups = {
    general = {
      name           = "general-${var.environment}"
      instance_types = ["t3.large"]
      min_size      = var.environment == "prod" ? 3 : 2
      max_size      = var.environment == "prod" ? 10 : 5
      desired_size  = var.environment == "prod" ? 3 : 2
      disk_size     = 50

      additional_tags = local.common_tags
    }
  }

  # Enable IRSA
  enable_irsa = true

  # Cluster encryption
  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }

  tags = local.common_tags
}

# RDS Instance
module "rds" {
  source = "./modules/rds"

  identifier = "urban-garden-${var.environment}"

  engine            = "postgres"
  engine_version    = "15.3"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_encrypted = true

  db_name  = var.database_name
  username = "urban_garden_admin"
  port     = 5432

  multi_az               = var.environment == "prod"
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  subnet_ids            = module.vpc.private_subnets

  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  tags = local.common_tags
}

# ElastiCache Redis Cluster
module "redis" {
  source = "./modules/redis"

  cluster_id           = "urban-garden-cache-${var.environment}"
  node_type           = var.cache_node_type
  num_cache_clusters  = var.environment == "prod" ? 3 : 2

  parameter_group_family = "redis6.x"
  engine_version       = "6.x"

  port                = 6379
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.redis_sg.id]

  automatic_failover_enabled    = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token_enabled           = true

  tags = local.common_tags
}

# Security Groups
resource "aws_security_group" "rds_sg" {
  name_prefix = "urban-garden-rds-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  tags = merge(local.common_tags, {
    Name = "urban-garden-rds-${var.environment}"
  })
}

resource "aws_security_group" "redis_sg" {
  name_prefix = "urban-garden-redis-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  tags = merge(local.common_tags, {
    Name = "urban-garden-redis-${var.environment}"
  })
}

# KMS key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

# Outputs
output "eks_cluster_endpoint" {
  description = "Endpoint for EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "Endpoint for RDS instance"
  value       = module.rds.endpoint
}

output "redis_endpoint" {
  description = "Endpoint for Redis cluster"
  value       = module.redis.endpoint
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}