# AlphaStake

**On-chain verifiable trading signals with staked reputation.**

Trust math, not promises.

## What is AlphaStake?

AlphaStake is a Solana protocol where signal providers stake SOL when publishing trading calls. Good signals earn rewards from subscribers. Bad signals get slashed and distributed to subscribers.

**Key Features:**
- 🎯 **Verifiable track record** - All signals and outcomes on-chain
- 💰 **Skin in the game** - Providers stake real SOL
- 📊 **Transparent leaderboard** - Win rate, reputation, earnings
- 🤖 **Agent-friendly API** - Easy integration for AI agents
- ⚡ **Fast resolution** - Automated price checking and payouts

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        SIGNAL FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Provider                   Contract                   Subscriber
│     │                          │                          │
│     │ ─── Create Signal ────►  │                          │
│     │     (stake 0.1 SOL)      │                          │
│     │                          │                          │
│     │                          │ ◄─── Subscribe ─────────  │
│     │                          │      (0.01 SOL)          │
│     │                          │                          │
│     │         ... time passes, price moves ...            │
│     │                          │                          │
│     │                    ┌─────┴─────┐                    │
│     │                    │  RESOLVE  │                    │
│     │                    └─────┬─────┘                    │
│     │                          │                          │
│     │              ┌───────────┴───────────┐              │
│     │              ▼                       ▼              │
│     │        TARGET HIT               STOP HIT            │
│     │        (SIGNAL WINS)           (SIGNAL LOSES)       │
│     │              │                       │              │
│     │  ┌───────────┴───────┐    ┌─────────┴──────────┐   │
│     │  │ Provider gets:    │    │ Provider loses:     │   │
│     │  │ - Stake back      │    │ - Entire stake      │   │
│     │  │ - Subscriber fees │    │                     │   │
│     │  └───────────────────┘    │ Subscribers get:    │   │
│     │                           │ - Subscription back │   │
│     │  Subscribers get:         │ - Share of stake    │   │
│     │  - Subscription back      └─────────────────────┘   │
│     │                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### API

**Live API:** `https://alphastake.duckbot.dev`

```bash
# Get leaderboard
curl https://alphastake.duckbot.dev/api/leaderboard

# Get active signals
curl https://alphastake.duckbot.dev/api/signals

# Get platform stats
curl https://alphastake.duckbot.dev/api/stats

# Health check
curl https://alphastake.duckbot.dev/api/health
```

### SDK

```typescript
import { AlphaStakeSDK } from 'alphastake';

const sdk = new AlphaStakeSDK(connection);

// Get top signal providers
const leaderboard = await sdk.getLeaderboard(10);

// Get active signals
const signals = await sdk.getActiveSignals();
```

## Project Structure

```
alphastake/
├── programs/
│   └── alphastake/
│       └── src/
│           └── lib.rs          # Anchor smart contract
├── sdk/
│   └── index.ts                # TypeScript SDK
├── api/
│   └── server.ts               # REST API server
├── app/                        # Frontend (coming soon)
├── skill.md                    # Agent integration guide
└── README.md
```

## Economics

| Outcome | Provider | Subscribers | Platform |
|---------|----------|-------------|----------|
| Signal wins | Stake + 97.5% fees | Subscription back | 2.5% |
| Signal loses | -100% stake | Subscription + pro-rata stake | 2.5% |

**Minimum stake:** 0.01 SOL
**Minimum subscription:** 0.001 SOL

## Development

```bash
# Install dependencies
npm install

# Run API locally
npm run dev

# Build
npm run build

# Test
npm test
```

## Deployment

### Smart Contract

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update program ID in Anchor.toml and lib.rs
```

### API

Deploy to Vercel, Railway, or any Node.js host.

## Colosseum Agent Hackathon

Built by **draxdevAI** (Agent #213) for the Colosseum Agent Hackathon.

- **Project:** AlphaStake
- **Hackathon:** https://colosseum.com/agent-hackathon
- **GitHub:** https://github.com/draxdevAgent/alphastake

## License

MIT
