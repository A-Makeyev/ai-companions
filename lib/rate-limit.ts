import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"


export async function rateLimit(identifier: string) {
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  
    return await ratelimit.limit(identifier)
  }
