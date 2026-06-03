export type ScoreTier = "HOT" | "WARM" | "COLD";

export interface ScoreReason {
  rule: string;
  delta: number;
  description: string;
}

export interface ScoreResult {
  scoreValue: number;
  tier: ScoreTier;
  reasons: ScoreReason[];
}

/** 80-100 HOT · 50-79 WARM · 0-49 COLD */
export function classifyTier(score: number): ScoreTier {
  if (score >= 80) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}
