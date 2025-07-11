# ---- Build Stage ----
FROM rust:1.88 as builder

# Create app directory
WORKDIR /app

# Fetch dependencies
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch

# Copy working code
COPY src ./src

# Pre-cache dependencies
RUN cargo build --release

# ---- Runtime Stage ----
FROM debian:bullseye-slim

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Set up non-root user
RUN useradd -m appuser

# Copy the built binary from the builder
COPY --from=builder /app/target/release/collab-editor-server /usr/local/bin/collab-editor-server

# Use non-root user
USER appuser

# Expose the WebSocket port
EXPOSE 8080

# Start the server
ENTRYPOINT ["/usr/local/bin/collab-editor-server"]
