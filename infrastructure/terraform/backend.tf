# Configure Terraform backend to store state in S3 with DynamoDB locking
terraform {
  backend "s3" {
    # S3 bucket for state storage with environment-based path
    bucket = "urban-gardening-terraform-state"
    key    = "terraform.tfstate"
    region = "us-west-2"  # Using default region from variables.tf

    # Enable encryption at rest using AWS-managed keys
    encrypt = true

    # DynamoDB table for state locking
    dynamodb_table = "urban-gardening-terraform-locks"

    # Additional security configurations
    acl            = "private"
    force_path_style = false
  }
}

# S3 bucket for storing Terraform state with security configurations
resource "aws_s3_bucket" "terraform_state" {
  bucket = "urban-gardening-terraform-state"

  # Enable versioning for state file history and recovery
  versioning {
    enabled = true
  }

  # Configure server-side encryption
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # Lifecycle rules for managing old state versions
  lifecycle_rule {
    enabled = true

    noncurrent_version_expiration {
      days = 90
    }
  }

  # Block all public access
  block_public_access {
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }

  # Enable access logging
  logging {
    target_bucket = "urban-gardening-access-logs"
    target_prefix = "terraform-state/"
  }

  tags = {
    Name        = "Terraform State Storage"
    Environment = "all"
    ManagedBy   = "terraform"
  }
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "urban-gardening-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  # Define table schema
  attribute {
    name = "LockID"
    type = "S"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Enable server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = "all"
    ManagedBy   = "terraform"
    Purpose     = "terraform-state-locking"
  }
}