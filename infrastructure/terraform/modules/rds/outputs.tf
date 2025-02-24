# Database connection endpoint output
output "db_endpoint" {
  description = "The connection endpoint URL for the RDS instance in format: <hostname>:<port>"
  value       = aws_db_instance.this.endpoint
  sensitive   = true
}

# Database hostname output
output "db_host" {
  description = "The hostname of the RDS instance for direct connection configuration"
  value       = aws_db_instance.this.address
  sensitive   = true
}

# Database port output
output "db_port" {
  description = "The port number on which the database instance accepts connections"
  value       = aws_db_instance.this.port
  sensitive   = false
}

# Security group ID output
output "db_security_group_id" {
  description = "The ID of the security group controlling network access to the RDS instance"
  value       = aws_security_group.this.id
  sensitive   = false
}