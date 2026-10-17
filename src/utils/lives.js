import { MAX_LIVES, LIFE_REFILL_MS } from '../constants/gamification';

// Lives refill with time (1 every 30 min), so they are calculated in the app (section 6.8)
export function currentLives({ lives = MAX_LIVES, livesUpdatedAt } = {}, now = Date.now()) {
  if (lives >= MAX_LIVES || !livesUpdatedAt) return Math.min(lives, MAX_LIVES);
  return Math.min(MAX_LIVES, lives + Math.floor((now - livesUpdatedAt) / LIFE_REFILL_MS));
}
