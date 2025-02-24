# Redis ElastiCache Module Variables
# Terraform Version: ~> 1.5
# Purpose: Defines configurable parameters for Redis cluster deployment in AWS

variable "environment" {
  type        = string
  description = "Deployment environment identifier for Redis cluster resources. Must be one of: dev (local/development), staging (integration testing), or prod (production). Controls environment-specific configurations and resource sizing."

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, or prod"
  }
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where Redis cluster will be deployed. Must be a valid AWS VPC ID where the cluster can be securely deployed with proper network isolation."

  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must begin with 'vpc-'"
  }
}

variable "private_subnets" {
  type        = list(string)
  description = "List of private subnet IDs for Redis cluster deployment. These subnets must be in the specified VPC and should be properly configured for internal access only."

  validation {
    condition     = length(var.private_subnets) >= 2
    error_message = "At least 2 private subnets must be provided for high availability"
  }
}

variable "private_subnets_cidr" {
  type        = list(string)
  description = "CIDR blocks of private subnets for security group rules. Used to configure network access controls and security group rules for the Redis cluster."

  validation {
    condition     = can([for cidr in var.private_subnets_cidr : cidrhost(cidr, 0)])
    error_message = "All CIDR blocks must be valid"
  }
}

variable "node_type" {
  type        = string
  description = "AWS ElastiCache node type for Redis instances. Sizes vary by environment: dev (cache.t3.micro), staging (cache.t3.small), prod (cache.t3.medium/large)."
  default     = "cache.t3.medium"

  validation {
    condition     = can(regex("^cache\\.", var.node_type))
    error_message = "Node type must be a valid ElastiCache instance type"
  }
}

variable "num_cache_nodes" {
  type        = number
  description = "Number of cache nodes in the Redis cluster. Dev environments typically use 1 node, staging 2 nodes, and production 2-3 nodes for high availability."
  default     = 2

  validation {
    condition     = var.num_cache_nodes >= 1 && var.num_cache_nodes <= 6
    error_message = "Number of cache nodes must be between 1 and 6"
  }
}

variable "tags" {
  type        = map(string)
  description = "Resource tags for Redis cluster components. Must include Project and ManagedBy tags at minimum. Additional environment-specific tags can be added."
  default = {
    Project    = "Urban Gardening Assistant"
    ManagedBy  = "Terraform"
    Component  = "Cache Layer"
  }
}