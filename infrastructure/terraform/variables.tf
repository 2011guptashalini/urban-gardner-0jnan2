# AWS region configuration
variable "aws_region" {
  type        = string
  description = "AWS region for infrastructure deployment. Must be a valid AWS region identifier."
  default     = "us-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.aws_region))
    error_message = "AWS region must be a valid region identifier (e.g., us-west-2)"
  }
}

# Environment specification
variable "environment" {
  type        = string
  description = "Deployment environment (dev/staging/prod) determining resource configurations and scaling parameters"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# VPC configuration
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC, must be a valid IPv4 CIDR range with sufficient address space for all components"
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && split("/", var.vpc_cidr)[1] <= 16
    error_message = "VPC CIDR must be a valid IPv4 CIDR block with at least /16 subnet size"
  }
}

# EKS cluster configuration
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster, must be unique within the AWS account and region"
  default     = "urban-gardening-cluster"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.cluster_name)) && length(var.cluster_name) <= 100
    error_message = "Cluster name must be lowercase alphanumeric with hyphens, start/end with alphanumeric, max 100 chars"
  }
}

# EKS node group configurations
variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    min_size      = number
    max_size      = number
    desired_size  = number
    disk_size     = number
    capacity_type = string
  }))
  description = "EKS node group configurations including instance types, scaling parameters, and capacity requirements"
  default = {
    default = {
      instance_types = ["t3.large"]
      min_size      = 2
      max_size      = 10
      desired_size  = 2
      disk_size     = 50
      capacity_type = "ON_DEMAND"
    }
  }
}

# RDS configuration
variable "db_instance_class" {
  type        = string
  description = "RDS instance class for PostgreSQL database, sized according to environment requirements"
  default     = "db.t3.medium"

  validation {
    condition     = can(regex("^db\\.(t3|r5|m5)\\.(micro|small|medium|large|xlarge|2xlarge)$", var.db_instance_class))
    error_message = "Instance class must be a valid RDS instance type (e.g., db.t3.medium)"
  }
}

variable "database_name" {
  type        = string
  description = "Name of the PostgreSQL database, must follow naming conventions and be unique"
  default     = "urban_gardening"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.database_name))
    error_message = "Database name must start with a letter, contain only alphanumeric and underscore, max 63 chars"
  }
}

# ElastiCache configuration
variable "cache_node_type" {
  type        = string
  description = "ElastiCache node type for Redis cluster, sized for performance requirements"
  default     = "cache.t3.micro"

  validation {
    condition     = can(regex("^cache\\.(t3|r5|m5)\\.(micro|small|medium|large|xlarge)$", var.cache_node_type))
    error_message = "Cache node type must be a valid ElastiCache instance type"
  }
}

variable "num_cache_nodes" {
  type        = number
  description = "Number of nodes in the Redis cluster for high availability"
  default     = 2

  validation {
    condition     = var.num_cache_nodes >= 2 && var.num_cache_nodes <= 6
    error_message = "Number of cache nodes must be between 2 and 6 for high availability"
  }
}

# Resource tagging
variable "tags" {
  type        = map(string)
  description = "Common tags to apply to all resources for organization and cost tracking"
  default = {
    Project     = "Urban Gardening Assistant"
    ManagedBy   = "Terraform"
    Environment = "${var.environment}"
  }
}