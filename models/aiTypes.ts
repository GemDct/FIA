// --- DRAFT TYPES ---

export interface ClientDraft {
  name: string | null;
  email: string | null;
  address: string | null;
  vatNumber: string | null;
  notes?: string | null;
}

export interface InvoiceLineDraft {
  label: string;
  quantity: number;
  unitPrice: number;
  vatRate: number | null;
}

export interface InvoiceDraft {
  type: 'INVOICE' | 'QUOTE';
  client: ClientDraft;
  lines: InvoiceLineDraft[];
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface CatalogItemDraft {
  type: 'PRODUCT' | 'SERVICE';
  name: string;
  defaultPrice: number;
  vatRate: number;
}

export type AnyDraft = InvoiceDraft | ClientDraft | CatalogItemDraft;

// --- AI RESPONSE TYPES ---

export type AiUnifiedResponse =
  | {
      status: "OK";
      entityType: "DOCUMENT" | "CLIENT" | "CATALOG_ITEM";
      draft: AnyDraft;
    }
  | {
      status: "NEED_INFO";
      entityType: "DOCUMENT" | "CLIENT" | "CATALOG_ITEM" | null;
      questions: {
        id: string;
        question: string;
      }[];
    };

export interface AiFollowupAnswer {
  questionId: string;
  answer: string;
}
