import { Lead } from "@prisma/client";
import { ScoreResult } from "./lead-score.entity";

export const SCORING_PROVIDER = Symbol("SCORING_PROVIDER");

export interface IScoringProvider {
  score(lead: Lead): Promise<ScoreResult>;
}
