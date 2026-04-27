import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

export const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 100 && amount <= 50000;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isRateLimited(key: string, limit: number = 100, windowMs: number = 900000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      return true;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return false;
  }
}

export const rateLimiter = new RateLimiter();
