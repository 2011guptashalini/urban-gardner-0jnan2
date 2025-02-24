# VPC CIDR Block Configuration
variable "cidr_block" {
  type        = string
  description = "CIDR block for the VPC network space. Must be a valid IPv4 CIDR block with sufficient size for all subnets."
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr_block, 0)) && split("/", var.cidr_block)[1] <= 16
    error_message = "VPC CIDR must be a valid IPv4 CIDR block with prefix length <= 16 for adequate subnet space"
  }
}

# Environment Configuration
variable "environment" {
  type        = string
  description = "Deployment environment identifier used for resource naming and tagging. Must be one of: dev, staging, prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# Availability Zones Configuration
variable "availability_zones" {
  type        = list(string)
  description = "List of AWS availability zones for subnet creation. Minimum 2 AZs required for high availability."

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones are required for high availability"
  }
}

# Private Subnet Configuration
variable "private_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for private subnets. Must be within VPC CIDR and have one per AZ."

  validation {
    condition     = length(var.private_subnet_cidrs) == length(var.availability_zones)
    error_message = "Number of private subnet CIDRs must match number of availability zones"
  }
}

# Public Subnet Configuration
variable "public_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for public subnets. Must be within VPC CIDR and have one per AZ."

  validation {
    condition     = length(var.public_subnet_cidrs) == length(var.availability_zones)
    error_message = "Number of public subnet CIDRs must match number of availability zones"
  }
}

# NAT Gateway Configuration
variable "enable_nat_gateway" {
  type        = bool
  description = "Enable NAT Gateway for private subnet internet access. Recommended for production environments."
  default     = true
}

variable "single_nat_gateway" {
  type        = bool
  description = "Use a single NAT Gateway for all private subnets. Reduces costs but decreases availability. Recommended for non-production environments."
  default     = false
}

# Resource Tagging Configuration
variable "tags" {
  type        = map(string)
  description = "Map of tags to apply to all VPC resources for resource management and cost allocation."
  default = {
    Project     = "Urban Gardening Assistant"
    ManagedBy   = "Terraform"
    Environment = "${var.environment}"
  }
}