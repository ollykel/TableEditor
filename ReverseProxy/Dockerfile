FROM nginx:stable-alpine

# Copy start.sh
WORKDIR /app
COPY start.sh ./

# Expose port 8080 and start nginx
EXPOSE 8080
CMD ["./start.sh"]
