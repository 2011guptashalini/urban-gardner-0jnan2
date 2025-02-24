# Configure Terraform settings and required providers
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

  # Configure remote state storage with encryption
  backend "s3" {
    bucket         = "urban-gardening-terraform-state"
    key            = "terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    
    # Enhanced security settings
    versioning     = true
    kms_key_id     = "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/terraform-state"
  }
}

# Data source for AWS account information
data "aws_caller_identity" "current" {}

# AWS Provider configuration with enhanced security and comprehensive tagging
provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Project            = "Urban Gardening Assistant"
      Environment       = var.environment
      ManagedBy        = "Terraform"
      Owner            = "DevOps"
      CostCenter       = "Engineering"
      SecurityLevel    = "High"
      DataClassification = "Confidential"
      CreatedDate      = timestamp()
    }
  }

  # Enhanced security settings
  assume_role {
    role_arn     = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/TerraformDeploymentRole"
    session_name = "TerraformProviderSession"
    external_id  = "UrbanGardeningAssistant"
  }
}

# Data sources for EKS cluster configuration
data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.cluster_name
}

# Kubernetes Provider configuration with secure authentication
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token

  # Enhanced security with AWS IAM authentication
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      var.cluster_name,
      "--region",
      var.aws_region
    ]
  }

  # Additional security configurations
  client_certificate     = null
  client_key            = null
  insecure              = false
  load_config_file      = false
}

# Configure provider timeouts and retry settings
provider "aws" {
  alias  = "with_retry_settings"
  region = var.aws_region

  # Retry settings for improved reliability
  max_retries = 10
  retry_mode  = "adaptive"
}