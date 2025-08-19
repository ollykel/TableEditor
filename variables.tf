variable "ec2_ssh_key" {
  description = "Private SSH key for connecting to EC2"
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
