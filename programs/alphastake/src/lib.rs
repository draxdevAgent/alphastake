use anchor_lang::prelude::*;

declare_id!("ALPHA1111111111111111111111111111111111111111");

#[program]
pub mod alphastake {
    use super::*;

    /// Initialize the protocol with admin settings
    pub fn initialize(ctx: Context<Initialize>, platform_fee_bps: u16) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.platform_fee_bps = platform_fee_bps; // e.g., 250 = 2.5%
        config.total_signals = 0;
        config.total_volume = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Register as a signal provider
    pub fn register_provider(ctx: Context<RegisterProvider>, name: String) -> Result<()> {
        require!(name.len() <= 32, AlphaError::NameTooLong);
        
        let provider = &mut ctx.accounts.provider;
        provider.authority = ctx.accounts.authority.key();
        provider.name = name;
        provider.total_signals = 0;
        provider.winning_signals = 0;
        provider.total_staked = 0;
        provider.total_earned = 0;
        provider.total_slashed = 0;
        provider.reputation_score = 500; // Start at 500 (neutral)
        provider.created_at = Clock::get()?.unix_timestamp;
        provider.bump = ctx.bumps.provider;
        Ok(())
    }

    /// Create a new signal with staked SOL
    pub fn create_signal(
        ctx: Context<CreateSignal>,
        token_mint: Pubkey,
        direction: SignalDirection,
        target_price: u64,      // Price in lamports (scaled)
        stop_loss: u64,         // Stop loss price
        timeframe_hours: u16,   // How long until resolution
        confidence: u8,         // 1-100
        reasoning: String,      // Why this signal
    ) -> Result<()> {
        require!(confidence >= 1 && confidence <= 100, AlphaError::InvalidConfidence);
        require!(timeframe_hours >= 1 && timeframe_hours <= 168, AlphaError::InvalidTimeframe); // Max 1 week
        require!(reasoning.len() <= 500, AlphaError::ReasoningTooLong);
        require!(ctx.accounts.stake_amount.lamports() >= MIN_STAKE, AlphaError::InsufficientStake);

        let clock = Clock::get()?;
        let signal = &mut ctx.accounts.signal;
        let provider = &mut ctx.accounts.provider;
        let config = &mut ctx.accounts.config;

        // Transfer stake to signal PDA
        let stake_amount = ctx.accounts.stake_amount.lamports();
        
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.signal_vault.to_account_info(),
                },
            ),
            stake_amount,
        )?;

        signal.provider = ctx.accounts.provider.key();
        signal.token_mint = token_mint;
        signal.direction = direction;
        signal.entry_price = 0; // Will be set by oracle/resolver
        signal.target_price = target_price;
        signal.stop_loss = stop_loss;
        signal.stake_amount = stake_amount;
        signal.confidence = confidence;
        signal.reasoning = reasoning;
        signal.created_at = clock.unix_timestamp;
        signal.expires_at = clock.unix_timestamp + (timeframe_hours as i64 * 3600);
        signal.resolved_at = 0;
        signal.status = SignalStatus::Active;
        signal.outcome = SignalOutcome::Pending;
        signal.final_price = 0;
        signal.subscriber_count = 0;
        signal.total_subscribed = 0;
        signal.bump = ctx.bumps.signal;

        // Update provider stats
        provider.total_signals += 1;
        provider.total_staked += stake_amount;

        // Update config stats
        config.total_signals += 1;
        config.total_volume += stake_amount;

        emit!(SignalCreated {
            signal: ctx.accounts.signal.key(),
            provider: ctx.accounts.provider.key(),
            token_mint,
            direction,
            target_price,
            stake_amount,
            expires_at: signal.expires_at,
        });

        Ok(())
    }

    /// Subscribe to a signal (pay to get notified + share in slash rewards)
    pub fn subscribe(ctx: Context<Subscribe>, amount: u64) -> Result<()> {
        require!(amount >= MIN_SUBSCRIPTION, AlphaError::InsufficientSubscription);
        
        let signal = &mut ctx.accounts.signal;
        require!(signal.status == SignalStatus::Active, AlphaError::SignalNotActive);
        require!(Clock::get()?.unix_timestamp < signal.expires_at, AlphaError::SignalExpired);

        // Transfer subscription to signal vault
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.subscriber.to_account_info(),
                    to: ctx.accounts.signal_vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let subscription = &mut ctx.accounts.subscription;
        subscription.signal = ctx.accounts.signal.key();
        subscription.subscriber = ctx.accounts.subscriber.key();
        subscription.amount = amount;
        subscription.subscribed_at = Clock::get()?.unix_timestamp;
        subscription.claimed = false;
        subscription.bump = ctx.bumps.subscription;

        signal.subscriber_count += 1;
        signal.total_subscribed += amount;

        emit!(Subscribed {
            signal: ctx.accounts.signal.key(),
            subscriber: ctx.accounts.subscriber.key(),
            amount,
        });

        Ok(())
    }

    /// Resolve a signal (called by oracle/keeper with price data)
    pub fn resolve_signal(
        ctx: Context<ResolveSignal>,
        final_price: u64,
    ) -> Result<()> {
        let signal = &mut ctx.accounts.signal;
        let provider = &mut ctx.accounts.provider;
        let config = &ctx.accounts.config;
        
        require!(signal.status == SignalStatus::Active, AlphaError::SignalNotActive);
        
        let clock = Clock::get()?;
        
        // Determine outcome
        let outcome = match signal.direction {
            SignalDirection::Long => {
                if final_price >= signal.target_price {
                    SignalOutcome::TargetHit
                } else if final_price <= signal.stop_loss {
                    SignalOutcome::StopHit
                } else if clock.unix_timestamp >= signal.expires_at {
                    // Expired without hitting target or stop
                    if final_price > signal.entry_price {
                        SignalOutcome::ExpiredProfit
                    } else {
                        SignalOutcome::ExpiredLoss
                    }
                } else {
                    return Err(AlphaError::SignalNotResolvable.into());
                }
            }
            SignalDirection::Short => {
                if final_price <= signal.target_price {
                    SignalOutcome::TargetHit
                } else if final_price >= signal.stop_loss {
                    SignalOutcome::StopHit
                } else if clock.unix_timestamp >= signal.expires_at {
                    if final_price < signal.entry_price {
                        SignalOutcome::ExpiredProfit
                    } else {
                        SignalOutcome::ExpiredLoss
                    }
                } else {
                    return Err(AlphaError::SignalNotResolvable.into());
                }
            }
        };

        signal.status = SignalStatus::Resolved;
        signal.outcome = outcome;
        signal.final_price = final_price;
        signal.resolved_at = clock.unix_timestamp;

        // Update provider stats based on outcome
        let is_win = matches!(outcome, SignalOutcome::TargetHit | SignalOutcome::ExpiredProfit);
        
        if is_win {
            provider.winning_signals += 1;
            provider.reputation_score = provider.reputation_score.saturating_add(10);
        } else {
            provider.reputation_score = provider.reputation_score.saturating_sub(15);
        }

        emit!(SignalResolved {
            signal: ctx.accounts.signal.key(),
            outcome,
            final_price,
        });

        Ok(())
    }

    /// Claim rewards/refunds after signal resolution
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let signal = &ctx.accounts.signal;
        let subscription = &mut ctx.accounts.subscription;
        let config = &ctx.accounts.config;
        
        require!(signal.status == SignalStatus::Resolved, AlphaError::SignalNotResolved);
        require!(!subscription.claimed, AlphaError::AlreadyClaimed);

        let is_win = matches!(signal.outcome, SignalOutcome::TargetHit | SignalOutcome::ExpiredProfit);
        
        let payout = if is_win {
            // Winner: subscriber gets back their subscription
            subscription.amount
        } else {
            // Loser: subscriber gets share of slashed stake
            let slash_amount = signal.stake_amount;
            let platform_fee = slash_amount * config.platform_fee_bps as u64 / 10000;
            let distributable = slash_amount - platform_fee;
            
            // Pro-rata share based on subscription amount
            subscription.amount + (distributable * subscription.amount / signal.total_subscribed)
        };

        subscription.claimed = true;

        // Transfer from vault to subscriber
        let signal_key = ctx.accounts.signal.key();
        let seeds = &[
            b"vault",
            signal_key.as_ref(),
            &[ctx.accounts.signal.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.signal_vault.to_account_info(),
                    to: ctx.accounts.subscriber.to_account_info(),
                },
                signer,
            ),
            payout,
        )?;

        emit!(Claimed {
            signal: ctx.accounts.signal.key(),
            subscriber: ctx.accounts.subscriber.key(),
            amount: payout,
        });

        Ok(())
    }

    /// Provider claims their stake back if signal won
    pub fn provider_claim(ctx: Context<ProviderClaim>) -> Result<()> {
        let signal = &ctx.accounts.signal;
        let provider = &mut ctx.accounts.provider;
        
        require!(signal.status == SignalStatus::Resolved, AlphaError::SignalNotResolved);
        require!(signal.provider == ctx.accounts.provider.key(), AlphaError::NotSignalProvider);
        
        let is_win = matches!(signal.outcome, SignalOutcome::TargetHit | SignalOutcome::ExpiredProfit);
        require!(is_win, AlphaError::SignalLost);

        // Provider gets stake back + subscriber fees (minus platform cut)
        let config = &ctx.accounts.config;
        let platform_fee = signal.total_subscribed * config.platform_fee_bps as u64 / 10000;
        let payout = signal.stake_amount + signal.total_subscribed - platform_fee;

        provider.total_earned += signal.total_subscribed - platform_fee;

        let signal_key = ctx.accounts.signal.key();
        let seeds = &[
            b"vault",
            signal_key.as_ref(),
            &[signal.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.signal_vault.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
                signer,
            ),
            payout,
        )?;

        emit!(ProviderClaimed {
            signal: ctx.accounts.signal.key(),
            provider: ctx.accounts.provider.key(),
            amount: payout,
        });

        Ok(())
    }
}

// === Constants ===
pub const MIN_STAKE: u64 = 10_000_000; // 0.01 SOL
pub const MIN_SUBSCRIPTION: u64 = 1_000_000; // 0.001 SOL

// === Accounts ===

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub platform_fee_bps: u16,
    pub total_signals: u64,
    pub total_volume: u64,
    pub bump: u8,
}

#[account]
pub struct Provider {
    pub authority: Pubkey,
    pub name: String,
    pub total_signals: u64,
    pub winning_signals: u64,
    pub total_staked: u64,
    pub total_earned: u64,
    pub total_slashed: u64,
    pub reputation_score: u16, // 0-1000
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct Signal {
    pub provider: Pubkey,
    pub token_mint: Pubkey,
    pub direction: SignalDirection,
    pub entry_price: u64,
    pub target_price: u64,
    pub stop_loss: u64,
    pub stake_amount: u64,
    pub confidence: u8,
    pub reasoning: String,
    pub created_at: i64,
    pub expires_at: i64,
    pub resolved_at: i64,
    pub status: SignalStatus,
    pub outcome: SignalOutcome,
    pub final_price: u64,
    pub subscriber_count: u32,
    pub total_subscribed: u64,
    pub bump: u8,
}

#[account]
pub struct Subscription {
    pub signal: Pubkey,
    pub subscriber: Pubkey,
    pub amount: u64,
    pub subscribed_at: i64,
    pub claimed: bool,
    pub bump: u8,
}

// === Enums ===

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SignalDirection {
    Long,
    Short,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SignalStatus {
    Active,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SignalOutcome {
    Pending,
    TargetHit,
    StopHit,
    ExpiredProfit,
    ExpiredLoss,
}

// === Contexts ===

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 8 + 8 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterProvider<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 36 + 8 + 8 + 8 + 8 + 8 + 2 + 8 + 1,
        seeds = [b"provider", authority.key().as_ref()],
        bump
    )]
    pub provider: Account<'info, Provider>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateSignal<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"provider", authority.key().as_ref()],
        bump = provider.bump
    )]
    pub provider: Account<'info, Provider>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 1 + 504 + 8 + 8 + 8 + 1 + 1 + 8 + 4 + 8 + 1,
        seeds = [b"signal", provider.key().as_ref(), &provider.total_signals.to_le_bytes()],
        bump
    )]
    pub signal: Account<'info, Signal>,
    /// CHECK: Vault PDA for holding stake
    #[account(
        mut,
        seeds = [b"vault", signal.key().as_ref()],
        bump
    )]
    pub signal_vault: AccountInfo<'info>,
    /// CHECK: Used to calculate stake amount
    pub stake_amount: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub signal: Account<'info, Signal>,
    #[account(
        init,
        payer = subscriber,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"subscription", signal.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    /// CHECK: Signal vault
    #[account(
        mut,
        seeds = [b"vault", signal.key().as_ref()],
        bump
    )]
    pub signal_vault: AccountInfo<'info>,
    #[account(mut)]
    pub subscriber: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveSignal<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signal: Account<'info, Signal>,
    #[account(
        mut,
        seeds = [b"provider", provider.authority.as_ref()],
        bump = provider.bump
    )]
    pub provider: Account<'info, Provider>,
    /// CHECK: Oracle/keeper authority
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    pub signal: Account<'info, Signal>,
    #[account(
        mut,
        seeds = [b"subscription", signal.key().as_ref(), subscriber.key().as_ref()],
        bump = subscription.bump
    )]
    pub subscription: Account<'info, Subscription>,
    /// CHECK: Signal vault
    #[account(
        mut,
        seeds = [b"vault", signal.key().as_ref()],
        bump
    )]
    pub signal_vault: AccountInfo<'info>,
    #[account(mut)]
    pub subscriber: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProviderClaim<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    pub signal: Account<'info, Signal>,
    #[account(
        mut,
        seeds = [b"provider", authority.key().as_ref()],
        bump = provider.bump
    )]
    pub provider: Account<'info, Provider>,
    /// CHECK: Signal vault
    #[account(
        mut,
        seeds = [b"vault", signal.key().as_ref()],
        bump
    )]
    pub signal_vault: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// === Events ===

#[event]
pub struct SignalCreated {
    pub signal: Pubkey,
    pub provider: Pubkey,
    pub token_mint: Pubkey,
    pub direction: SignalDirection,
    pub target_price: u64,
    pub stake_amount: u64,
    pub expires_at: i64,
}

#[event]
pub struct Subscribed {
    pub signal: Pubkey,
    pub subscriber: Pubkey,
    pub amount: u64,
}

#[event]
pub struct SignalResolved {
    pub signal: Pubkey,
    pub outcome: SignalOutcome,
    pub final_price: u64,
}

#[event]
pub struct Claimed {
    pub signal: Pubkey,
    pub subscriber: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProviderClaimed {
    pub signal: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
}

// === Errors ===

#[error_code]
pub enum AlphaError {
    #[msg("Name too long (max 32 chars)")]
    NameTooLong,
    #[msg("Reasoning too long (max 500 chars)")]
    ReasoningTooLong,
    #[msg("Invalid confidence (must be 1-100)")]
    InvalidConfidence,
    #[msg("Invalid timeframe (must be 1-168 hours)")]
    InvalidTimeframe,
    #[msg("Insufficient stake (min 0.01 SOL)")]
    InsufficientStake,
    #[msg("Insufficient subscription (min 0.001 SOL)")]
    InsufficientSubscription,
    #[msg("Signal not active")]
    SignalNotActive,
    #[msg("Signal expired")]
    SignalExpired,
    #[msg("Signal not resolvable yet")]
    SignalNotResolvable,
    #[msg("Signal not resolved")]
    SignalNotResolved,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Not the signal provider")]
    NotSignalProvider,
    #[msg("Signal lost - no claim available")]
    SignalLost,
}
