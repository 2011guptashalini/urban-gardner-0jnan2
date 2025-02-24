# EKS Cluster Endpoint Output
output "cluster_endpoint" {
  description = "Endpoint URL of the EKS cluster API server. Required for Kubernetes provider and kubectl configuration. Must be accessible from allowed security groups."
  value       = aws_eks_cluster.main.endpoint
  
  precondition {
    condition     = can(regex("^https://", aws_eks_cluster.main.endpoint))
    error_message = "Cluster endpoint must be a valid HTTPS URL"
  }
}

# EKS Cluster Name Output
output "cluster_name" {
  description = "Name of the EKS cluster. Used for resource tagging, monitoring configuration, and cluster identification in AWS console and CLI operations."
  value       = aws_eks_cluster.main.name
  
  precondition {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", aws_eks_cluster.main.name))
    error_message = "Cluster name must start with letter and contain only alphanumeric characters and hyphens"
  }
}

# EKS Cluster Security Group ID Output
output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster. Required for network security configuration and firewall rule management. Controls access to cluster endpoint."
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

# EKS Cluster Certificate Authority Data Output
output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required for cluster authentication. Used by Kubernetes provider and kubectl for secure API server communication."
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
  
  precondition {
    condition     = can(base64decode(aws_eks_cluster.main.certificate_authority[0].data))
    error_message = "Certificate authority data must be valid base64 encoded"
  }
}

# EKS Node Group ARN Output
output "node_group_arn" {
  description = "ARN of the EKS node group. Used for IAM policy attachments, resource tagging, and AWS API operations."
  value       = aws_eks_node_group.main.arn
}

# EKS Node Group Status Output
output "node_group_status" {
  description = "Status of the EKS node group. Used for health monitoring and scaling operations. Valid values: CREATING, ACTIVE, UPDATING, DELETING, DELETE_FAILED, DEGRADED."
  value       = aws_eks_node_group.main.status
  
  precondition {
    condition     = contains(["CREATING", "ACTIVE", "UPDATING", "DELETING", "DELETE_FAILED", "DEGRADED"], aws_eks_node_group.main.status)
    error_message = "Node group status must be a valid EKS status value"
  }
}

# EKS Cluster Version Output
output "cluster_version" {
  description = "Kubernetes version running on the EKS cluster. Used for version compatibility checks and upgrade planning."
  value       = aws_eks_cluster.main.version
  
  precondition {
    condition     = can(regex("^\\d+\\.\\d+$", aws_eks_cluster.main.version))
    error_message = "Cluster version must be in major.minor format"
  }
}

# EKS Cluster Tags Output
output "cluster_tags" {
  description = "Tags applied to the EKS cluster. Used for resource organization, cost allocation, and automation."
  value       = aws_eks_cluster.main.tags
}