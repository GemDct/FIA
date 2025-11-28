import {
  AiClientResponse,
  AiFollowupAnswer,
} from "../models/aiTypes";
import {
  askGeminiForClientDraft,
  ClientDraftRequestPayload,
} from "../services/geminiService";

/**
 * Endpoint to initiate a client draft from a raw description.
 */
export async function createClientDraftFromDescription(
  description: string
): Promise<AiClientResponse> {
  const payload: ClientDraftRequestPayload = { description };
  return await askGeminiForClientDraft(payload);
}

/**
 * Endpoint to continue the client creation with answers.
 */
export async function continueClientDraftWithAnswers(
  description: string,
  followupAnswers: AiFollowupAnswer[]
): Promise<AiClientResponse> {
  const payload: ClientDraftRequestPayload = { description, followupAnswers };
  return await askGeminiForClientDraft(payload);
}
