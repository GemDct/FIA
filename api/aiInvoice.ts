import {
  AiInvoiceResponse,
  AiFollowupAnswer,
} from "../models/aiTypes";
import {
  askGeminiForInvoiceDraft,
  InvoiceDraftRequestPayload,
} from "../services/geminiService";

/**
 * Endpoint to initiate an invoice draft from a raw description.
 */
export async function createInvoiceDraftFromDescription(
  description: string
): Promise<AiInvoiceResponse> {
  const payload: InvoiceDraftRequestPayload = { description };
  return await askGeminiForInvoiceDraft(payload);
}

/**
 * Endpoint to continue the conversation with answers to missing info.
 */
export async function continueInvoiceDraftWithAnswers(
  description: string,
  followupAnswers: AiFollowupAnswer[]
): Promise<AiInvoiceResponse> {
  const payload: InvoiceDraftRequestPayload = { description, followupAnswers };
  return await askGeminiForInvoiceDraft(payload);
}
