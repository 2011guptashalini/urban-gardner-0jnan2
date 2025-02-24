# EKS Cluster Outputs
output "eks_cluster_endpoint" {
  description = "The endpoint URL for the EKS cluster API server"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate" {
  description = "The certificate authority data for the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

# RDS Database Outputs
output "rds_endpoint" {
  description = "The connection endpoint for the RDS PostgreSQL database"
  value       = module.rds.db_instance_endpoint
}

output "rds_connection_string" {
  description = "The full connection string for the RDS PostgreSQL database"
  value       = format("postgresql://%s:%s@%s:%s/%s", 
    module.rds.db_instance_username,
    module.rds.db_instance_password,
    module.rds.db_instance_address,
    module.rds.db_instance_port,
    module.rds.db_instance_name
  )
  sensitive = true
}

# Redis ElastiCache Outputs
output "redis_endpoint" {
  description = "The endpoint address for the Redis ElastiCache cluster"
  value       = module.redis.primary_endpoint_address
}

output "redis_connection_string" {
  description = "The full connection string for the Redis ElastiCache cluster"
  value       = format("redis://%s:%s",
    module.redis.primary_endpoint_address,
    module.redis.port
  )
  sensitive = true
}

# Load Balancer Output
output "load_balancer_dns" {
  description = "The DNS name of the application load balancer"
  value       = module.alb.dns_name
}

# VPC Security Groups Output
output "vpc_security_group_ids" {
  description = "The IDs of the security groups created for the VPC"
  value       = module.vpc.security_group_ids
}

# CloudFront Distribution Output
output "cloudfront_distribution_domain" {
  description = "The domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

# Monitoring Endpoints Output
output "monitoring_endpoints" {
  description = "The endpoints for monitoring services (Prometheus, Grafana)"
  value = {
    prometheus = module.monitoring.prometheus_endpoint
    grafana    = module.monitoring.grafana_endpoint
  }
}