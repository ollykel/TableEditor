variable "docker_username" {}
variable "docker_password" {}
variable "ec2_ssh_key" {}
variable "env_file" {}
variable "subnet_id" {}

resource "aws_instance" "app" {
  ami                           = "ami-0d98eb61174b7e522 " # Ubuntu 24.04
  instance_type                 = "t3.micro"
  key_name                      = "table-editor-default"
  subnet_id                     = var.subnet_id
  associate_public_ip_address   = false

  # Install Docker + Compose on first provision
  user_data = <<-EOF
    #!/bin/bash

    # Install docker
    sudo snap install docker
    usermod -aG docker ubuntu
    service docker start
    sudo systemctl enable --now docker

    # Set up app directory
    mkdir -p /home/ubuntu/app
    chown ubuntu:ubuntu /home/ubuntu/app
  EOF

  tags = {
    Name = "table-editor"
  }
}

# Elastic IP Address
resource "aws_eip" "app_ip" {
  instance = aws_instance.app.id
  vpc      = true

  tags = {
    Name = "table-editor-ip"
  }
}

# Run "docker compose pull && up" after image push
resource "null_resource" "deploy" {
  depends_on = [aws_instance.app]
  # Force refresh when images change
  triggers = {
    redeploy_time = timestamp()
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = var.ec2_ssh_key
    host        = aws_instance.app.public_ip
  }

  provisioner "file" {
    source        = "docker-compose.yml"
    destination   = "/home/ubuntu/app/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      <<-EOC
      cat > /home/ubuntu/app/.env << _EOF_
      ${var.env_file}
      _EOF_
      EOC,
      "echo '${var.docker_password}' | docker login -u '${var.docker_username}' --password-stdin",
      "cd /home/ubuntu/app && docker compose pull && docker compose up -d"
    ]
  }
}

output "app_ip" {
  value = aws_eip.app_ip.public_ip
}
