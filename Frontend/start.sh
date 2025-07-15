#!/bin/sh

# Entrypoint for the service
NGINX_CONF=/etc/nginx/nginx.conf

# Initialize nginx.conf from environment variables
if [[ ! "${TABLE_EDITOR_FRONTEND_PORT}" ]]
then
  echo "ERROR: \$${TABLE_EDITOR_FRONTEND_PORT} not set"
  exit 1
fi

cat > "${NGINX_CONF}" << _EOF_
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen ${TABLE_EDITOR_FRONTEND_PORT};
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri \$uri/ =404;
        }
    }
}
_EOF_

# Start service
exec nginx -g "daemon off;"
