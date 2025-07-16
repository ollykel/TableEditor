FROM nginx:stable-alpine

# Copy start.sh
WORKDIR /app
COPY start.sh .

# Copy ssl files
COPY cert.pem .
COPY key.pem .

# Expose port 8080 and start nginx
EXPOSE 8080
CMD ["./start.sh"]
