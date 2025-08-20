variable "ec2_ssh_key" {
  description = "Private SSH key for connecting to EC2"
  type        = string
  sensitive   = true
}

variable "ec2_key_pair_name" {
  description = "Name of key pair for connecting to EC2"
  type        = string
  sensitive   = true
}

variable "docker_username" {
  description = "Docker registry username"
  type        = string
}

variable "docker_password" {
  description = "Docker registry password"
  type        = string
  sensitive   = true
}

variable "env_file" {
  description   = "Contents of the repository .env file"
  type          = string
  sensitive     = true
}

variable "subnet_id" {
  description   = "ID of subnet to use on EC2"
  type          = string
  sensitive     = true
}

variable "ssl_key_file" {
  description   = "Contents of SSL key file to place in ReverseProxy/"
  type          = string
  sensitive     = true
}

variable "ssl_cert_file" {
  description   = "Contents of SSL certificate file to place in ReverseProxy/"
  type          = string
  sensitive     = true
}
