FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 2000 and start nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
