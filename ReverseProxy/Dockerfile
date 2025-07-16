FROM nginx:stable-alpine

# Copy nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Copy ssl files
WORKDIR /app
COPY cert.pem .
COPY key.pem .

# Expose port 8080 and start nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
