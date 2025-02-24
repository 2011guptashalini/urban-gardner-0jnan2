# AWS provider validation
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# EKS cluster name
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster for the Urban Gardening Assistant application"
  default     = "urban-gardening-cluster"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.cluster_name)) && length(var.cluster_name) <= 100
    error_message = "Cluster name must be lowercase alphanumeric with hyphens, start/end with alphanumeric, max 100 chars"
  }
}

# Kubernetes version
variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version to use for the EKS cluster, must be compatible with application requirements"
  default     = "1.25"

  validation {
    condition     = can(regex("^1\\.(2[4-5])$", var.kubernetes_version))
    error_message = "Kubernetes version must be 1.24 or 1.25 for compatibility"
  }
}

# VPC configuration
variable "vpc_id" {
  type        = string
  description = "ID of the VPC where EKS cluster will be deployed for network isolation"

  validation {
    condition     = can(regex("^vpc-[a-z0-9]+$", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC identifier"
  }
}

# Subnet configuration
variable "subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for EKS node groups, must span multiple AZs"

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least two subnets are required for high availability"
  }
}

# Node group configuration
variable "node_group_name" {
  type        = string
  description = "Name prefix for EKS node groups"
  default     = "urban-gardening-nodes"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.node_group_name))
    error_message = "Node group name must start with a letter and contain only alphanumeric characters and hyphens"
  }
}

variable "instance_types" {
  type        = list(string)
  description = "List of EC2 instance types for the EKS node groups based on environment"
  default     = ["t3.medium", "t3.large"]

  validation {
    condition     = alltrue([for t in var.instance_types : can(regex("^t3\\.(medium|large|xlarge)|^m5\\.(large|xlarge|2xlarge)$", t))])
    error_message = "Instance types must be valid EC2 instance types from t3 or m5 families"
  }
}

# Node group scaling configuration
variable "desired_size" {
  type        = number
  description = "Desired number of worker nodes for high availability"
  default     = 3

  validation {
    condition     = var.desired_size >= 2 && var.desired_size <= 10
    error_message = "Desired size must be between 2 and 10 nodes for optimal operation"
  }
}

variable "min_size" {
  type        = number
  description = "Minimum number of worker nodes to maintain service availability"
  default     = 2

  validation {
    condition     = var.min_size >= 2
    error_message = "Minimum size must be at least 2 for high availability"
  }
}

variable "max_size" {
  type        = number
  description = "Maximum number of worker nodes for peak load handling"
  default     = 10

  validation {
    condition     = var.max_size >= var.min_size && var.max_size <= 20
    error_message = "Maximum size must be greater than minimum size and not exceed 20 nodes"
  }
}

# Cluster logging configuration
variable "cluster_enabled_log_types" {
  type        = list(string)
  description = "EKS cluster logging types for monitoring and debugging"
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  validation {
    condition     = alltrue([for t in var.cluster_enabled_log_types : contains(["api", "audit", "authenticator", "controllerManager", "scheduler"], t)])
    error_message = "Log types must be valid EKS logging types"
  }
}

# Node group disk configuration
variable "disk_size" {
  type        = number
  description = "Size of the EBS volume for each node in GB"
  default     = 50

  validation {
    condition     = var.disk_size >= 20 && var.disk_size <= 500
    error_message = "Disk size must be between 20GB and 500GB"
  }
}

# Resource tagging
variable "tags" {
  type        = map(string)
  description = "Resource tags for cost allocation and management"
  default = {
    Project     = "Urban Gardening Assistant"
    ManagedBy   = "Terraform"
    Component   = "EKS"
    Environment = "Production"
  }

  validation {
    condition     = length(var.tags) > 0
    error_message = "At least one tag must be specified for resource management"
  }
}

# IAM configuration
variable "cluster_role_name" {
  type        = string
  description = "Name of the IAM role for the EKS cluster"
  default     = "urban-gardening-eks-cluster-role"

  validation {
    condition     = can(regex("^[\\w+=,.@-]{1,64}$", var.cluster_role_name))
    error_message = "Cluster role name must be valid IAM role name format"
  }
}

variable "node_role_name" {
  type        = string
  description = "Name of the IAM role for the EKS node groups"
  default     = "urban-gardening-eks-node-role"

  validation {
    condition     = can(regex("^[\\w+=,.@-]{1,64}$", var.node_role_name))
    error_message = "Node role name must be valid IAM role name format"
  }
}