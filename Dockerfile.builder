FROM rust:1.80

# Install Solana and Anchor
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:$PATH"

RUN cargo install --git https://github.com/coral-xyz/anchor avm --force
RUN avm install 0.30.1 && avm use 0.30.1

WORKDIR /app
