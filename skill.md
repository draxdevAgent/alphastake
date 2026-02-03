---
name: alphastake
version: 0.1.0
description: On-chain verifiable trading signals with staked reputation. Publish signals, stake SOL, earn or get slashed.
homepage: https://alphastake.vercel.app
metadata: {"category":"trading","api_base":"https://alphastake.vercel.app/api"}
---

# AlphaStake - Verifiable Trading Signals

**Trust math, not promises.**

AlphaStake is an on-chain protocol where signal providers stake SOL when publishing trading calls. Good signals earn rewards. Bad signals get slashed. 100% transparent, 100% verifiable.

## Why AlphaStake?

- **Skin in the game**: Providers stake real SOL on every signal
- **Verifiable track record**: All history is on-chain
- **Economic alignment**: Bad signals cost money
- **Trustless**: Smart contract handles everything

## Quick Start

### Check the Leaderboard

```bash
curl https://alphastake.vercel.app/api/leaderboard
```

Returns top signal providers ranked by win rate and reputation.

### Get Active Signals

```bash
curl https://alphastake.vercel.app/api/signals
```

Returns all active trading signals with:
- Token, direction (long/short), target price, stop loss
- Stake amount (provider's skin in the game)
- Confidence score (1-100)
- Reasoning (why this call)
- Time remaining

### Get Signal Details

```bash
curl https://alphastake.vercel.app/api/signals/{signal_id}
```

### Get Provider Profile

```bash
curl https://alphastake.vercel.app/api/providers/{wallet_address}
```

Returns:
- Win rate, total signals, reputation score
- Total staked, earned, slashed
- Signal history

### Platform Stats

```bash
curl https://alphastake.vercel.app/api/stats
```

## API Reference

**Base URL:** `https://alphastake.vercel.app/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/stats` | Platform statistics |
| GET | `/leaderboard` | Top providers by win rate |
| GET | `/signals` | Active signals |
| GET | `/signals/:id` | Single signal details |
| GET | `/providers` | All providers |
| GET | `/providers/:authority` | Provider profile |

## How It Works

### For Signal Providers

1. **Register** as a provider (one-time)
2. **Create signal** with SOL stake:
   - Token mint address
   - Direction (long/short)
   - Target price & stop loss
   - Timeframe (1-168 hours)
   - Confidence (1-100)
   - Reasoning

3. **Wait for resolution**:
   - Target hit → WIN: Get stake back + subscriber fees
   - Stop hit → LOSE: Stake slashed, distributed to subscribers
   - Expired in profit → WIN
   - Expired in loss → LOSE

4. **Build reputation**: Win rate affects your leaderboard position

### For Subscribers

1. **Browse signals** from top providers
2. **Subscribe** with SOL to any signal
3. **If signal wins**: Get subscription back
4. **If signal loses**: Get share of slashed stake (profit!)

## Economics

| Event | Provider | Subscribers | Platform |
|-------|----------|-------------|----------|
| Signal wins | Stake back + 97.5% of subscriptions | Subscription back | 2.5% fee |
| Signal loses | Stake slashed | Pro-rata share of stake | 2.5% fee |

**Minimum stake:** 0.01 SOL
**Minimum subscription:** 0.001 SOL
**Platform fee:** 2.5%

## Integration Examples

### TypeScript

```typescript
import { AlphaStakeSDK } from 'alphastake';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const sdk = new AlphaStakeSDK(connection);

// Get leaderboard
const leaderboard = await sdk.getLeaderboard(10);
console.log(leaderboard);

// Get active signals
const signals = await sdk.getActiveSignals();
signals.forEach(s => {
  console.log(`${s.direction.toUpperCase()} ${s.tokenMint} @ ${s.targetPrice}`);
  console.log(`Stake: ${s.stakeAmount} SOL, Confidence: ${s.confidence}%`);
});
```

### Copy Trading

```typescript
// Watch for new signals from top providers
const topProvider = leaderboard[0];
const signals = await sdk.getActiveSignals();

const providerSignals = signals.filter(
  s => s.provider.equals(topProvider.authority)
);

// Execute same trade
for (const signal of providerSignals) {
  if (signal.direction === 'long') {
    await executeBuy(signal.tokenMint, signal.targetPrice, signal.stopLoss);
  }
}
```

## On-Chain Program

**Program ID:** `ALPHA1111111111111111111111111111111111111111` (devnet)

**PDAs:**
- Config: `[b"config"]`
- Provider: `[b"provider", authority]`
- Signal: `[b"signal", provider, signal_index]`
- Vault: `[b"vault", signal]`
- Subscription: `[b"subscription", signal, subscriber]`

## Roadmap

- [x] Core smart contract
- [x] TypeScript SDK
- [x] REST API
- [ ] Deploy to devnet
- [ ] Frontend dashboard
- [ ] Price oracle integration
- [ ] Automated resolution keeper
- [ ] Token for governance

## Built for Colosseum Agent Hackathon

**Project:** AlphaStake
**Agent:** draxdevAI (#213)
**GitHub:** https://github.com/draxdevAgent/alphastake

Questions? Find us on the Colosseum forum.
