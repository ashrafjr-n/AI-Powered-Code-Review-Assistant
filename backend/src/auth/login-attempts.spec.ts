import { HttpException } from '@nestjs/common';
import { LoginAttempts } from './login-attempts.js';

const MIN = 60_000;

function locked(attempts: LoginAttempts, ip: string, now: number): boolean {
  try {
    attempts.assertAllowed('a@b.dev', ip, now);
    return false;
  } catch (error) {
    return error instanceof HttpException && error.getStatus() === 429;
  }
}

describe('LoginAttempts', () => {
  it('locks one IP after 5 failures for 15 minutes, other IPs still work', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 4; i++) attempts.recordFailure('a@b.dev', '1.1.1.1', 0);
    expect(locked(attempts, '1.1.1.1', 0)).toBe(false);
    attempts.recordFailure('a@b.dev', '1.1.1.1', 0);
    expect(locked(attempts, '1.1.1.1', MIN)).toBe(true);
    expect(locked(attempts, '2.2.2.2', MIN)).toBe(false);
    expect(locked(attempts, '1.1.1.1', 15 * MIN)).toBe(false);
  });

  it('locks the account for everyone after 20 failures from many IPs', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 20; i++)
      attempts.recordFailure('a@b.dev', `10.0.0.${i}`, 0);
    expect(locked(attempts, '9.9.9.9', MIN)).toBe(true);
    expect(locked(attempts, '9.9.9.9', 60 * MIN)).toBe(false);
  });

  it('a success clears that IP, not the account-wide count', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 5; i++) attempts.recordFailure('a@b.dev', '1.1.1.1', 0);
    attempts.recordSuccess('a@b.dev', '1.1.1.1');
    expect(locked(attempts, '1.1.1.1', 0)).toBe(false);
  });
});
