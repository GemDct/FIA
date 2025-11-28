import React, { useState } from 'react';
import { Sparkles, Send, Loader2, ArrowRight, Check, AlertCircle, UserPlus, Package, FileText } from 'lucide-react';
import { AiUnifiedResponse, AiFollowupAnswer, InvoiceDraft, ClientDraft, CatalogItemDraft, AnyDraft } from '../models/aiTypes';
import { createDraftFromDescription, continueDraftWithAnswers } from '../api/ai';
import { Textarea, Input } from './FormElements';

interface AiAssistantProps {
  onDocumentDraftAccepted: (draft: InvoiceDraft) => void;
  onClientDraftAccepted: (draft: ClientDraft) => void;
  onCatalogItemDraftAccepted: (draft: CatalogItemDraft) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
  onDocumentDraftAccepted,
  onClientDraftAccepted,
  onCatalogItemDraftAccepted,
}) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiUnifiedResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleInitialSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setAiResponse(null);
    setAnswers({});

    try {
      const response = await createDraftFromDescription(description);
      console.log("AI RESPONSE (initial):", response);
      setAiResponse(response);
    } catch (err) {
      setError("Une erreur est survenue lors de l'analyse de votre demande.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupSubmit = async () => {
    if (!aiResponse || aiResponse.status !== 'NEED_INFO' || !aiResponse.questions) return;

    const followupAnswers: AiFollowupAnswer[] = aiResponse.questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || ''
    }));

    setLoading(true);
    setError('');

    try {
      const response = await continueDraftWithAnswers(description, followupAnswers);
      console.log("AI RESPONSE (followup):", response);
      setAiResponse(response);
    } catch (err) {
      setError("Erreur lors de la mise à jour du brouillon.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const renderQuestions = (questions: { id: string; question: string }[]) => (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800">J'ai besoin de précisions</h3>
          <p className="text-sm text-amber-600">Répondez aux questions ci-dessous pour finaliser le brouillon.</p>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        {questions.map(q => (
          <div key={q.id}>
            <Input
              label={q.question}
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              placeholder="Votre réponse..."
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleFollowupSubmit}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer les réponses
        </button>
      </div>
    </div>
  );

  const renderDraft = (entityType: "DOCUMENT" | "CLIENT" | "CATALOG_ITEM", draft: AnyDraft) => {
    let title, icon, content, buttonText, action;

    switch (entityType) {
      case 'DOCUMENT':
        const docDraft = draft as InvoiceDraft;
        title = "Brouillon de document prêt !";
        icon = <FileText className="w-5 h-5" />;
        content = (
          <>
            <p><strong>Client:</strong> {docDraft.client.name || 'Non spécifié'}</p>
            <div className="mt-2"><strong>Lignes:</strong>
              <ul className="list-disc list-inside text-slate-600 ml-1">
                {docDraft.lines.map((line, idx) => <li key={idx}>{line.label} — {line.quantity} x {line.unitPrice}€</li>)}
              </ul>
            </div>
          </>
        );
        buttonText = "Utiliser ce brouillon";
        action = () => onDocumentDraftAccepted(docDraft);
        break;

      case 'CLIENT':
        const clientDraft = draft as ClientDraft;
        title = "Fiche client prête !";
        icon = <UserPlus className="w-5 h-5" />;
        content = (
          <>
            <p><strong>Nom:</strong> {clientDraft.name}</p>
            {clientDraft.email && <p><strong>Email:</strong> {clientDraft.email}</p>}
            {clientDraft.address && <p><strong>Adresse:</strong> {clientDraft.address}</p>}
          </>
        );
        buttonText = "Créer ce client";
        action = () => onClientDraftAccepted(clientDraft);
        break;

      case 'CATALOG_ITEM':
        const itemDraft = draft as CatalogItemDraft;
        title = "Article de catalogue prêt !";
        icon = <Package className="w-5 h-5" />;
        content = (
          <>
            <p><strong>Nom:</strong> {itemDraft.name}</p>
            <p><strong>Type:</strong> {itemDraft.type}</p>
            <p><strong>Prix par défaut:</strong> {itemDraft.defaultPrice}€</p>
          </>
        );
        buttonText = `Créer cet ${itemDraft.type === 'PRODUCT' ? 'article' : 'élément'}`;
        action = () => onCatalogItemDraftAccepted(itemDraft);
        break;

      default:
        setError(`Type d'entité inattendu: ${entityType}`);
        return null;
    }

    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">{icon}</div>
          <h3 className="font-semibold text-emerald-800">{title}</h3>
        </div>
        <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm text-sm space-y-1">{content}</div>
        <div className="flex justify-end">
          <button onClick={action} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            {buttonText} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Assistant IA
        </h2>
        <p className="text-slate-500">Décrivez ce que vous voulez créer (facture, client, produit...).</p>
      </div>

      {!aiResponse || aiResponse.status === 'NEED_INFO' ? (
        <div className="mb-8">
           <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading || (aiResponse?.status === 'NEED_INFO')}
            placeholder="Ex: Facture pour Acme, refonte site web 2000€... ou Nouveau client Jean Dupont, jean@email.com..."
            rows={4}
            className="mb-4"
          />
          {!aiResponse && (
             <div className="flex justify-end">
               <button onClick={handleInitialSubmit} disabled={loading || !description.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyser la demande
              </button>
             </div>
          )}
        </div>
      ) : null}

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-6">{error}</div>}
      {aiResponse?.status === 'NEED_INFO' && aiResponse.questions && renderQuestions(aiResponse.questions)}
      {aiResponse?.status === 'OK' && renderDraft(aiResponse.entityType, aiResponse.draft)}
    </div>
  );
};