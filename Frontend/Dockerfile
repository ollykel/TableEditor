# ---- Stage 1: Install dependencies and build ----
FROM node:24 AS builder

WORKDIR /app

# Copy package manager files first (for Docker caching)
COPY package.json ./

# Install dependencies
RUN npm install
RUN npm ci

# Copy the rest of the app source
COPY . .

# Build the Vite app (output goes to /app/dist)
RUN npm run build

# ---- Stage 2: Serve with a static web server ----
FROM nginx:stable-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000 and start nginx
CMD ["nginx", "-g", "daemon off;"]
