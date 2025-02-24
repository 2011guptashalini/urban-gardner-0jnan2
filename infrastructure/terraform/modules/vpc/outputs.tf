# VPC ID Output
output "vpc_id" {
  description = "The ID of the VPC used for deploying EKS, RDS, and Redis resources"
  value       = aws_vpc.main.id

  precondition {
    condition     = aws_vpc.main.id != ""
    error_message = "VPC ID must not be empty"
  }
}

# VPC CIDR Output
output "vpc_cidr" {
  description = "The CIDR block of the VPC for network planning and security group rules"
  value       = aws_vpc.main.cidr_block

  precondition {
    condition     = can(cidrhost(aws_vpc.main.cidr_block, 0))
    error_message = "VPC CIDR block must be valid"
  }
}

# Private Subnet IDs Output
output "private_subnet_ids" {
  description = <<-EOT
    List of private subnet IDs for EKS node groups and RDS multi-AZ deployment.
    These subnets are distributed across availability zones for high availability.
  EOT
  value = {
    for idx, subnet in aws_subnet.private : 
    subnet.availability_zone => subnet.id
  }

  precondition {
    condition     = length(aws_subnet.private) >= 2
    error_message = "At least two private subnets must exist for high availability"
  }
}

# Public Subnet IDs Output
output "public_subnet_ids" {
  description = <<-EOT
    List of public subnet IDs for load balancer placement across AZs.
    These subnets have direct internet access through the Internet Gateway.
  EOT
  value = {
    for idx, subnet in aws_subnet.public : 
    subnet.availability_zone => subnet.id
  }

  precondition {
    condition     = length(aws_subnet.public) >= 2
    error_message = "At least two public subnets must exist for high availability"
  }
}

# NAT Gateway IDs Output
output "nat_gateway_ids" {
  description = <<-EOT
    List of NAT gateway IDs enabling private subnet internet access.
    The number of NAT gateways depends on the single_nat_gateway variable setting.
  EOT
  value = aws_nat_gateway.main[*].id

  precondition {
    condition     = var.enable_nat_gateway ? length(aws_nat_gateway.main) > 0 : true
    error_message = "NAT gateways must exist when enable_nat_gateway is true"
  }
}

# Default Security Group ID Output
output "default_security_group_id" {
  description = "The ID of the default security group created with the VPC"
  value       = aws_vpc.main.default_security_group_id

  precondition {
    condition     = aws_vpc.main.default_security_group_id != ""
    error_message = "Default security group ID must not be empty"
  }
}

# Route Table IDs Output
output "route_table_ids" {
  description = <<-EOT
    Map of route table IDs for both public and private subnets.
    Useful for adding custom routes or managing network access.
  EOT
  value = {
    public  = aws_route_table.public.id
    private = aws_route_table.private[*].id
  }
}

# VPC Flow Log Configuration Output
output "flow_log_config" {
  description = "Configuration details for VPC flow logs"
  value = {
    log_group_name = aws_cloudwatch_log_group.flow_log.name
    role_arn       = aws_iam_role.flow_log.arn
  }
}