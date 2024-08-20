export class RateLimiter {
    private tokens: Map<string, number>;
    private lastRefill: Map<string, number>;
    private readonly limit: number;
    private readonly refillTime: number;
  
    constructor(limit: number, refillTime: number) {
      this.tokens = new Map();
      this.lastRefill = new Map();
      this.limit = limit;
      this.refillTime = refillTime;
    }
  
    tryAcquire(clientId: string): boolean {
      const now = Date.now();
      let tokens = this.tokens.get(clientId) || this.limit;
      const lastRefill = this.lastRefill.get(clientId) || 0;
  
      if (now - lastRefill > this.refillTime) {
        tokens = this.limit;
        this.lastRefill.set(clientId, now);
      }
  
      if (tokens > 0) {
        this.tokens.set(clientId, tokens - 1);
        return true;
      }
  
      return false;
    }
  }