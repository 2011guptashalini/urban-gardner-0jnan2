# AWS Provider configuration with version constraint
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# RDS subnet group for multi-AZ deployment
resource "aws_db_subnet_group" "this" {
  name        = "${var.environment}-urban-gardening-db-subnet"
  subnet_ids  = var.private_subnets
  description = "Subnet group for Urban Gardening Assistant RDS instance"

  tags = merge(var.tags, {
    Name        = "${var.environment}-urban-gardening-db-subnet"
    Environment = var.environment
  })
}

# Security group for RDS instance
resource "aws_security_group" "this" {
  name        = "${var.environment}-urban-gardening-db-sg"
  description = "Security group for Urban Gardening Assistant RDS instance"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL traffic from private subnets
  ingress {
    description = "PostgreSQL access from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.private_subnets_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-urban-gardening-db-sg"
    Environment = var.environment
  })
}

# RDS PostgreSQL instance
resource "aws_db_instance" "this" {
  identifier = "${var.environment}-urban-gardening-db"

  # Engine configuration
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  # Database configuration
  db_name  = var.database_name
  username = var.db_username
  password = var.db_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  multi_az              = var.multi_az
  publicly_accessible   = false

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.environment}-urban-gardening-db-final"

  # Performance and monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports      = ["postgresql", "upgrade"]

  # Additional configuration
  auto_minor_version_upgrade = true
  deletion_protection       = true
  parameter_group_name      = var.parameter_group_name
  apply_immediately         = false

  tags = merge(var.tags, {
    Name             = "${var.environment}-urban-gardening-db"
    Environment      = var.environment
    BackupRetention  = "${var.backup_retention_period} days"
    MultiAZ          = var.multi_az
  })
}

# CloudWatch alarms for RDS monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-urban-gardening-db-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors RDS CPU utilization"
  alarm_actions      = []  # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-urban-gardening-db-cpu-alarm"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "database_memory" {
  alarm_name          = "${var.environment}-urban-gardening-db-freeable-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "FreeableMemory"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "1000000000"  # 1GB in bytes
  alarm_description  = "This metric monitors RDS freeable memory"
  alarm_actions      = []  # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-urban-gardening-db-memory-alarm"
    Environment = var.environment
  })
}

# Outputs for other modules to consume
output "endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.this.endpoint
}

output "address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.this.address
}

output "port" {
  description = "The port the RDS instance is listening on"
  value       = aws_db_instance.this.port
}

output "arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}