# ---- Stage 1: Dependency planner (cargo-chef) ----
FROM rust:1.88 AS planner

WORKDIR /app

# Install cargo-chef
RUN cargo install cargo-chef

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Dummy build file to make Cargo happy
RUN mkdir src/
COPY src/dummy.rs src/dummy.rs

# Generate dependency build plan
RUN cargo chef prepare --recipe-path recipe.json

# ---- Stage 2: Dependency builder ----
FROM rust:1.88 AS cacher

WORKDIR /app

# Install cargo-chef
RUN cargo install cargo-chef

# Copy and execute the dependency build plan
COPY --from=planner /app/recipe.json recipe.json
COPY Cargo.toml Cargo.lock ./
RUN cargo chef cook --release --recipe-path recipe.json

# ---- Stage 3: Application build ----
FROM rust:1.88 AS builder

WORKDIR /app

# Copy everything
COPY . .

# Copy built dependencies from cacher
COPY --from=cacher /app/target /app/target
COPY --from=cacher /usr/local/cargo /usr/local/cargo

# Build the final binary
RUN cargo build --release

# ---- Stage 4: Minimal runtime ----
FROM debian:trixie-slim

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Set up non-root user
RUN useradd -m appuser

# Copy compiled binary
COPY --from=builder /app/target/release/collab-editor-server /usr/local/bin/collab-editor-server

USER appuser
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/collab-editor-server"]
