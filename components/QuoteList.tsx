import React from 'react';
import { Invoice, InvoiceStatus, Client } from '../types';
import { FileSpreadsheet, ArrowRight, Edit, Trash2, Plus, Sparkles } from 'lucide-react';

interface QuoteListProps {
  quotes: Invoice[];
  clients: Client[];
  onEdit: (quote: Invoice) => void;
  onConvert: (quote: Invoice) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onOpenAI: () => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({ 
  quotes, 
  clients, 
  onEdit, 
  onConvert, 
  onDelete,
  onCreate,
  onOpenAI 
}) => {
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Inconnu';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Devis</h2>
          <p className="text-slate-500">Gérez vos propositions commerciales.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={onOpenAI}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            IA
          </button>
          <button 
            onClick={onCreate}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau Devis
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px] md:min-w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-medium text-slate-500">Numéro</th>
                <th className="py-4 px-6 font-medium text-slate-500">Client</th>
                <th className="py-4 px-6 font-medium text-slate-500">Date</th>
                <th className="py-4 px-6 font-medium text-slate-500">Montant</th>
                <th className="py-4 px-6 font-medium text-slate-500">Statut</th>
                <th className="py-4 px-6 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6 font-medium text-indigo-600">{quote.number}</td>
                  <td className="py-4 px-6 text-slate-600">{getClientName(quote.clientId)}</td>
                  <td className="py-4 px-6 text-slate-600">{quote.date}</td>
                  <td className="py-4 px-6 font-medium text-slate-900">{quote.total.toFixed(2)} €</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onConvert(quote)}
                        title="Convertir en Facture"
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        Convertir <ArrowRight className="w-3 h-3" />
                      </button>
                      <button onClick={() => onEdit(quote)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                       <button onClick={() => onDelete(quote.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                 <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucun devis en cours.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};