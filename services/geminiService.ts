import { GoogleGenAI, Type } from "@google/genai";
import { AIInvoiceResponse } from "../types";
import {
  AiFollowupAnswer,
  InvoiceDraft,
  ClientDraft,
  CatalogItemDraft,
  AnyDraft,
  AiUnifiedResponse,
} from "../models/aiTypes";

// --- PROMPT ET SCHÉMA UNIFIÉS ---

const SYSTEM_INSTRUCTION = `
# Rôle et Objectif
Tu es "FastInvoice AI", un assistant expert en gestion commerciale et facturation intégré à une application. Ton rôle est d'analyser les requêtes des utilisateurs en langage naturel et de les transformer en données JSON structurées. Tu dois être précis, proactif et toujours répondre dans le format JSON spécifié.

# Contexte de l'Application
L'utilisateur a accès aux entités suivantes :
- **Clients**: Contacts facturés.
- **Produits (Products)**: Articles prédéfinis avec un prix par défaut.
- **Services**: Prestations prédéfinies avec un prix par défaut.
- **Factures (Invoices)**: Documents de paiement.
- **Devis (Quotes)**: Propositions commerciales.

Tu dois être capable de créer des brouillons pour chacune de ces entités.

# Directives Générales
1.  **Analyse l'intention**: Détermine si l'utilisateur veut créer une facture, un devis, un client, un produit ou un service. L'intention est définie par le champ "entityType".
    - "DOCUMENT" pour une facture ou un devis.
    - "CLIENT" pour un client.
    - "CATALOG_ITEM" pour un produit ou un service.
    - Si ce n'est pas clair, demande-lui de préciser avec status: "NEED_INFO".
2.  **Extraction d'entités**: Extrais toutes les informations pertinentes : noms, emails, adresses, SIRET, descriptions d'articles, quantités, prix, taux de TVA, dates, etc.
3.  **Logique Proactive**:
    *   Si un taux de TVA n'est pas spécifié pour un article, suppose le taux standard de 20%.
    *   Si une quantité n'est pas spécifiée, suppose une quantité de 1.
    *   Si une date d'échéance n'est pas spécifiée pour une facture, calcule-la à 30 jours après la date d'émission (aujourd'hui).
    *   Si l'utilisateur mentionne "devis pour...", l'intention est de créer un 'QUOTE'. Sinon, c'est une 'INVOICE'.
4.  **Gestion des Informations Manquantes**: Si une information absolument critique manque (ex: le prix d'un article, le nom d'un client, le nom d'un produit), tu DOIS répondre avec \`status: "NEED_INFO"\` et poser des questions claires et concises. Ne demande qu'une seule information par question.
5.  **Gestion du Suivi**: Si tu reçois des réponses de l'utilisateur (\`followupAnswers\`), tu dois impérativement les utiliser pour compléter le brouillon. Ne repose PAS les mêmes questions. Après au maximum une itération de \`NEED_INFO\`, tu DOIS renvoyer \`status: "OK"\` avec le meilleur brouillon possible, même si certaines valeurs optionnelles sont nulles.
6.  **Format de Réponse STRICT**: Ta réponse doit TOUJOURS être un objet JSON valide. Ne fournis aucune explication ou texte en dehors de l'objet JSON.

# Formats de Réponse JSON
Ta réponse doit correspondre à ce schéma global :
{
  "status": "OK" | "NEED_INFO",
  "entityType": "DOCUMENT" | "CLIENT" | "CATALOG_ITEM",
  "draft": { ... },
  "questions": [ { "id": string, "question": string } ]
}

## 1. Brouillon de Document (Facture/Devis)
- **Intention**: "Crée une facture pour...", "Facture pour...", "Devis pour..."
- **Format de sortie ("draft")**:
{
    "type": "INVOICE" | "QUOTE",
    "client": { "name": "Nom du client", "email": "email@client.com" },
    "lines": [ { "label": "Description", "quantity": 1, "unitPrice": 1500.00, "vatRate": 20.0 } ],
    "dueDate": "YYYY-MM-DD",
    "notes": "Généré par FastInvoice AI"
}

## 2. Brouillon de Client
- **Intention**: "Nouveau client...", "Ajoute le contact..."
- **Format de sortie ("draft")**:
{
    "name": "Nom Complet ou Société",
    "email": "email@client.com",
    "address": "Adresse complète",
    "vatNumber": "FRXX123456789"
}

## 3. Brouillon de Produit/Service
- **Intention**: "Nouveau produit...", "Ajouter le service..."
- **Format de sortie ("draft")**:
{
    "type": "PRODUCT" | "SERVICE",
    "name": "Nom du produit/service",
    "defaultPrice": 150.00,
    "vatRate": 20.0
}
`;

const UNIFIED_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ["OK", "NEED_INFO"] },
    entityType: {
      type: Type.STRING,
      enum: ["DOCUMENT", "CLIENT", "CATALOG_ITEM"],
      nullable: true,
    },
    draft: {
      type: Type.OBJECT,
      nullable: true,
      oneOf: [
        // InvoiceDraft
        {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["INVOICE", "QUOTE"] },
            client: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, nullable: true },
                email: { type: Type.STRING, nullable: true },
                address: { type: Type.STRING, nullable: true },
                vatNumber: { type: Type.STRING, nullable: true },
              },
            },
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  vatRate: { type: Type.NUMBER, nullable: true },
                },
              },
            },
            dueDate: { type: Type.STRING, nullable: true },
            notes: { type: Type.STRING, nullable: true },
          },
        },
        // ClientDraft
        {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, nullable: true },
            email: { type: Type.STRING, nullable: true },
            address: { type: Type.STRING, nullable: true },
            vatNumber: { type: Type.STRING, nullable: true },
            notes: { type: Type.STRING, nullable: true },
          },
        },
        // CatalogItemDraft
        {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["PRODUCT", "SERVICE"] },
            name: { type: Type.STRING },
            defaultPrice: { type: Type.NUMBER },
            vatRate: { type: Type.NUMBER },
          },
        },
      ],
    },
    questions: {
      type: Type.ARRAY,
      nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
        },
        required: ["id", "question"],
      },
    },
  },
  required: ["status"],
};

// --- NOUVELLE FONCTION UNIFIÉE ---

export interface DraftRequestPayload {
  description: string;
  followupAnswers?: AiFollowupAnswer[];
}

// Construit le contexte envoyé à l'IA
function buildContextPrompt(
  description: string,
  followupAnswers?: AiFollowupAnswer[]
) {
  const parts: string[] = [];

  parts.push(
    [
      "Contexte utilisateur pour FastInvoice AI :",
      "",
      "Demande initiale :",
      description.trim(),
    ].join("\n")
  );

  if (followupAnswers && followupAnswers.length > 0) {
    const formattedAnswers = followupAnswers
      .map((ans) => `- ${ans.questionId}: ${ans.answer}`)
      .join("\n");

    parts.push(
      [
        "",
        "Réponses de suivi fournies par l'utilisateur :",
        formattedAnswers,
        "",
        "Utilise ces informations supplémentaires pour compléter le brouillon.",
        'Si les informations sont suffisantes, réponds avec { "status": "OK", ... }.',
        'Sinon, réponds avec { "status": "NEED_INFO", "questions": [...] }.'
      ].join("\n")
    );
  }

  return parts.join("\n");
}

/**
 * Fonction centrale pour interroger Gemini avec le prompt unifié.
 */
export async function askGeminiForDraft(
  payload: DraftRequestPayload
): Promise<AiUnifiedResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing for Gemini");
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildContextPrompt(
    payload.description,
    payload.followupAnswers
  );
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION.replace("${today}", today),
        responseMimeType: "application/json",
        // responseSchema: UNIFIED_RESPONSE_SCHEMA, // optionnel
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    try {
      return JSON.parse(text) as AiUnifiedResponse;
    } catch (jsonError) {
      console.error("AI returned invalid JSON:", text);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error) {
    console.error("AI Unified Service Error:", error);
    throw error;
  }
}

// --- Legacy Simple Parse (gardé pour compatibilité si nécessaire) ---
export const parseInvoiceRequest = async (
  prompt: string
): Promise<AIInvoiceResponse | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing for Gemini.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an invoicing assistant. Extract invoice details from the user request.
        If the user mentions a date (e.g. "due next week"), calculate the date in YYYY-MM-DD format based on the current date.
        If no specific quantity is given for an item, assume 1.
        Extract the client name if present.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: {
              type: Type.STRING,
              description: "The name of the client or company to bill.",
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                },
                required: ["description", "quantity", "price"],
              },
            },
            dueDate: {
              type: Type.STRING,
              description:
                "The due date in YYYY-MM-DD format, or null if not specified.",
            },
          },
          required: ["clientName", "items"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIInvoiceResponse;
  } catch (error) {
    console.error("Error parsing invoice with AI:", error);
    return null;
  }
};
