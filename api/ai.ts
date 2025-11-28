import {
  AiUnifiedResponse,
  AiFollowupAnswer,
} from "../models/aiTypes";
import {
  askGeminiForDraft,
  DraftRequestPayload,
} from "../services/geminiService";

/**
 * Endpoint to initiate a draft from a raw description for any entity.
 */
export async function createDraftFromDescription(
  description: string
): Promise<AiUnifiedResponse> {
  const payload: DraftRequestPayload = { description };
  return await askGeminiForDraft(payload);
}

/**
 * Endpoint to continue the conversation with answers to missing info.
 */
export async function continueDraftWithAnswers(
  description: string,
  followupAnswers: AiFollowupAnswer[]
): Promise<AiUnifiedResponse> {
  const payload: DraftRequestPayload = { description, followupAnswers };
  return await askGeminiForDraft(payload);
}