# Environment configuration
variable "environment" {
  type        = string
  description = "Deployment environment (dev/staging/prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# VPC configuration
variable "vpc_id" {
  type        = string
  description = "ID of the VPC where RDS will be deployed"
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC identifier"
  }
}

variable "private_subnets" {
  type        = list(string)
  description = "List of private subnet IDs for RDS deployment"
  validation {
    condition     = length(var.private_subnets) >= 2
    error_message = "At least two private subnets are required for high availability"
  }
}

variable "private_subnets_cidr" {
  type        = list(string)
  description = "CIDR blocks of private subnets for security group rules"
  validation {
    condition     = alltrue([for cidr in var.private_subnets_cidr : can(cidrhost(cidr, 0))])
    error_message = "All CIDR blocks must be valid IPv4 CIDR notation"
  }
}

# RDS instance configuration
variable "instance_class" {
  type        = string
  description = "RDS instance class for PostgreSQL database"
  default     = "db.t3.medium"
  validation {
    condition     = can(regex("^db\\.(t3|r5|m5)\\.", var.instance_class))
    error_message = "Instance class must be a valid RDS instance type"
  }
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage size in GB"
  default     = 20
  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 100
    error_message = "Allocated storage must be between 20 and 100 GB"
  }
}

variable "max_allocated_storage" {
  type        = number
  description = "Maximum storage size in GB for autoscaling"
  default     = 100
  validation {
    condition     = var.max_allocated_storage >= var.allocated_storage
    error_message = "Maximum allocated storage must be greater than or equal to allocated storage"
  }
}

# Database configuration
variable "database_name" {
  type        = string
  description = "Name of the PostgreSQL database"
  default     = "urban_gardening"
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.database_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores"
  }
}

variable "db_username" {
  type        = string
  description = "Master username for the RDS instance"
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username))
    error_message = "Username must start with a letter and contain only alphanumeric characters and underscores"
  }
}

# High availability configuration
variable "multi_az" {
  type        = bool
  description = "Enable Multi-AZ deployment for high availability"
  default     = false
}

# Backup configuration
variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain automated backups"
  default     = 30
  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days"
  }
}

# Resource tagging
variable "tags" {
  type        = map(string)
  description = "Tags to apply to all RDS resources"
  default = {
    Project    = "Urban Gardening Assistant"
    ManagedBy  = "Terraform"
  }
}