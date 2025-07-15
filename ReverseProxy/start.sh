#!/bin/sh

# Entrypoint for the service
NGINX_CONF=/etc/nginx/nginx.conf

if [[ ! "${TABLE_EDITOR_FRONTEND_PORT}" ]]
then
  echo "ERROR: env var \$TABLE_EDITOR_FRONTEND_PORT not set" >&2
  exit 1
fi

if [[ ! "${TABLE_EDITOR_WS_PORT}" ]]
then
  echo "ERROR: env var \$TABLE_EDITOR_WS_PORT not set" >&2
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

    map \$http_upgrade \$connection_upgrade {
        default upgrade;
        ''      close;
    }

    server {
        listen 8080;
        server_name localhost;

        # WebSocket route
        location /ws {
            proxy_pass http://web_socket_server:${TABLE_EDITOR_WS_PORT}/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
        }

        # All other traffic
        location / {
            proxy_pass http://frontend:${TABLE_EDITOR_FRONTEND_PORT};
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
        }
    }
}
_EOF_

# Start service
exec nginx -g "daemon off;"
