# Redis ElastiCache Module Configuration
# Terraform Version: ~> 1.5
# Provider Version: hashicorp/aws ~> 5.0

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Redis subnet group for multi-AZ deployment
resource "aws_elasticache_subnet_group" "redis_subnet" {
  name        = "${var.environment}-redis-subnet-group"
  description = "Subnet group for ${var.environment} Redis cluster"
  subnet_ids  = var.private_subnets
  tags        = var.tags
}

# Redis parameter group with optimized settings
resource "aws_elasticache_parameter_group" "redis_params" {
  family      = "redis6.x"
  name        = "${var.environment}-redis-params"
  description = "Redis parameter group for ${var.environment} environment"

  # Memory management settings
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  # Connection timeout
  parameter {
    name  = "timeout"
    value = "300"
  }

  # Enable keyspace notifications for session management
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  # Enable active defragmentation
  parameter {
    name  = "activedefrag"
    value = "yes"
  }

  # TCP keepalive settings
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  tags = var.tags
}

# Redis replication group with encryption and automatic failover
resource "aws_elasticache_replication_group" "redis_cluster" {
  replication_group_id          = "${var.environment}-redis-cluster"
  description                   = "Redis cluster for Urban Gardening Assistant - ${var.environment}"
  node_type                     = var.node_type
  num_cache_clusters           = var.num_cache_nodes
  parameter_group_name         = aws_elasticache_parameter_group.redis_params.name
  port                         = 6379
  subnet_group_name            = aws_elasticache_subnet_group.redis_subnet.name
  security_group_ids          = [aws_security_group.redis_sg.id]
  
  # High availability settings
  automatic_failover_enabled   = true
  multi_az_enabled            = true
  
  # Engine configuration
  engine                      = "redis"
  engine_version             = "6.x"
  
  # Encryption settings
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  auth_token_enabled         = true
  
  # Backup configuration
  backup_retention_period    = var.backup_retention_period
  snapshot_window           = var.snapshot_window
  maintenance_window        = "mon:03:00-mon:04:00"
  
  # Performance settings
  apply_immediately         = true
  auto_minor_version_upgrade = true
  
  tags = var.tags
}

# Security group for Redis cluster
resource "aws_security_group" "redis_sg" {
  name        = "${var.environment}-redis-sg"
  description = "Security group for Redis cluster in ${var.environment}"
  vpc_id      = var.vpc_id

  # Inbound rule for Redis port access
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks     = var.private_subnets_cidr
    description     = "Redis port access from private subnets"
  }

  # Outbound rule allowing all traffic
  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
    description     = "Allow all outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis-security-group"
    }
  )
}

# Output values for Redis cluster
output "redis_endpoint" {
  description = "Redis cluster endpoints for application configuration"
  value = {
    primary_endpoint_address = aws_elasticache_replication_group.redis_cluster.primary_endpoint_address
    reader_endpoint_address  = aws_elasticache_replication_group.redis_cluster.reader_endpoint_address
    port                    = aws_elasticache_replication_group.redis_cluster.port
  }
}

output "security_group" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis_sg.id
}