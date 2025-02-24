# Redis ElastiCache Module Outputs
# Terraform Version: ~> 1.5
# Purpose: Exposes Redis cluster connection details and security group information

# Primary endpoint for write operations
output "redis_primary_endpoint" {
  description = "Primary endpoint address of the Redis cluster for write operations"
  value       = aws_elasticache_replication_group.redis_cluster.primary_endpoint_address
  sensitive   = true
}

# Reader endpoint for read operations in multi-node setups
output "redis_reader_endpoint" {
  description = "Reader endpoint address of the Redis cluster for read operations in multi-node setups"
  value       = aws_elasticache_replication_group.redis_cluster.reader_endpoint_address
  sensitive   = true
}

# Redis port number
output "redis_port" {
  description = "Port number for Redis cluster connections"
  value       = aws_elasticache_replication_group.redis_cluster.port
  sensitive   = true
}

# Security group ID for network access configuration
output "redis_security_group_id" {
  description = "ID of the security group attached to Redis cluster"
  value       = aws_security_group.redis_sg.id
  sensitive   = false
}

# Security group name for reference
output "redis_security_group_name" {
  description = "Name of the security group attached to Redis cluster"
  value       = aws_security_group.redis_sg.name
  sensitive   = false
}

# Complete connection string for primary endpoint
output "redis_primary_connection_string" {
  description = "Full Redis connection string for the primary endpoint in the format redis://host:port"
  value       = format("redis://%s:%s", 
    aws_elasticache_replication_group.redis_cluster.primary_endpoint_address,
    aws_elasticache_replication_group.redis_cluster.port
  )
  sensitive   = true
}

# Complete connection string for reader endpoint
output "redis_reader_connection_string" {
  description = "Full Redis connection string for the reader endpoint in the format redis://host:port"
  value       = format("redis://%s:%s", 
    aws_elasticache_replication_group.redis_cluster.reader_endpoint_address,
    aws_elasticache_replication_group.redis_cluster.port
  )
  sensitive   = true
}