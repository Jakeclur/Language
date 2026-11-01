// Spaced repetition with FSRS (ts-fsrs). PLAN.md §2.4
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from "ts-fsrs";

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));

export type StoredCard = Omit<Card, "due" | "last_review"> & { due: string; last_review?: string };
export { Rating };

export function newCard(now = new Date()): StoredCard {
  return serialise(createEmptyCard(now));
}

function serialise(c: Card): StoredCard {
  return { ...c, due: new Date(c.due).toISOString(), last_review: c.last_review ? new Date(c.last_review).toISOString() : undefined };
}

function revive(c: StoredCard): Card {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined } as Card;
}

export function review(card: StoredCard, grade: Grade, now = new Date()): StoredCard {
  return serialise(scheduler.next(revive(card), now, grade).card);
}

export const isDue = (card: StoredCard, now = new Date()) => new Date(card.due).getTime() <= now.getTime();

/** Human-friendly time until the next review for each grade, for the rating buttons. */
export function preview(card: StoredCard, now = new Date()): Record<number, string> {
  const rec = scheduler.repeat(revive(card), now);
  const out: Record<number, string> = {};
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
    const ms = new Date(rec[g as Grade].card.due).getTime() - now.getTime();
    const min = Math.round(ms / 60000);
    out[g] = min < 60 ? `${Math.max(1, min)}m` : min < 60 * 24 ? `${Math.round(min / 60)}h` : `${Math.round(min / 1440)}d`;
  }
  return out;
}
