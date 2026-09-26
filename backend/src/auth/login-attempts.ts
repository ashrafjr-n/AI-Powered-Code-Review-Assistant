import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

// Failed sign-ins per account (OWASP "account lockout", kept short so an attacker
// can't lock the real owner out for long):
// - one IP guessing one account: 5 failures, then wait 15 minutes
// - many IPs guessing one account: 20 failures in an hour, then wait
const PER_IP = { max: 5, windowMs: 15 * 60_000 };
const PER_ACCOUNT = { max: 20, windowMs: 60 * 60_000 };
const PRUNE_ABOVE = 10_000;

interface Counter {
  count: number;
  resetAt: number;
}

// ponytail: in memory, fine for one server instance (Render). Move to Redis or a
// table if the API ever runs on several instances.
@Injectable()
export class LoginAttempts {
  private readonly counters = new Map<string, Counter>();

  /** Throws 429 while this email is locked for this IP or for everyone. */
  assertAllowed(email: string, ip: string, now = Date.now()): void {
    const wait = Math.max(
      this.lockedFor(`ip:${ip}|${email}`, PER_IP.max, now),
      this.lockedFor(`account:${email}`, PER_ACCOUNT.max, now),
    );
    if (wait > 0)
      throw new HttpException(
        {
          message: `Too many failed sign-ins for this account. Try again in ${Math.ceil(wait / 60_000)} min.`,
          code: 'LOGIN_LOCKED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  recordFailure(email: string, ip: string, now = Date.now()): void {
    this.bump(`ip:${ip}|${email}`, PER_IP.windowMs, now);
    this.bump(`account:${email}`, PER_ACCOUNT.windowMs, now);
  }

  /** The owner got in from this IP: forget its failures (the account-wide count stays). */
  recordSuccess(email: string, ip: string): void {
    this.counters.delete(`ip:${ip}|${email}`);
  }

  private lockedFor(key: string, max: number, now: number): number {
    const counter = this.counters.get(key);
    return counter && counter.resetAt > now && counter.count >= max
      ? counter.resetAt - now
      : 0;
  }

  private bump(key: string, windowMs: number, now: number): void {
    const counter = this.counters.get(key);
    if (!counter || counter.resetAt <= now)
      this.counters.set(key, { count: 1, resetAt: now + windowMs });
    else counter.count++;
    if (this.counters.size > PRUNE_ABOVE)
      for (const [k, c] of this.counters)
        if (c.resetAt <= now) this.counters.delete(k);
  }
}
