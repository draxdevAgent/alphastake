FROM rustlang/rust:nightly

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor CLI
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli

WORKDIR /app
