import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { parseInvoiceRequest } from '../services/geminiService';
import { AIInvoiceResponse } from '../types';
import { baseInputStyles } from './FormElements';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: AIInvoiceResponse) => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await parseInvoiceRequest(prompt);
      if (result) {
        onSuccess(result);
        onClose();
        setPrompt('');
      } else {
        setError("Impossible de comprendre la demande. Essayez d'être plus précis.");
      }
    } catch (err) {
      setError("Une erreur est survenue. Vérifiez votre clé API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-lg">Assistant Facturation IA</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 mb-4 text-sm">
            Décrivez votre facture en langage naturel. Je vais pré-remplir le formulaire pour vous.
          </p>
          <p className="text-xs text-slate-400 italic mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            Exemple: "Facture pour Client Alpha, développement site web 1500€ et maintenance 200€, échéance le 30 juin"
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`${baseInputStyles} h-32 resize-none mb-4`}
              placeholder="Tapez votre demande ici..."
              autoFocus
            />
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};