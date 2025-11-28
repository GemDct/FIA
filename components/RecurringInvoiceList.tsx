
import React, { useState } from 'react';
import { RecurringInvoice, Client } from '../types';
import { Edit, Play, Plus, Power, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

interface RecurringInvoiceListProps {
  recurringInvoices: RecurringInvoice[];
  clients: Client[];
  onEdit: (rec: RecurringInvoice) => void;
  onToggleActive: (rec: RecurringInvoice) => void;
  onRunNow: () => void;
  onCreate: () => void;
}

export const RecurringInvoiceList: React.FC<RecurringInvoiceListProps> = ({ 
  recurringInvoices, 
  clients, 
  onEdit, 
  onToggleActive, 
  onRunNow, 
  onCreate 
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Inconnu';

  const handleRunNow = async () => {
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 1000)); // Sim delay
    onRunNow();
    setIsRunning(false);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'WEEKLY': return 'Hebdomadaire';
      case 'MONTHLY': return 'Mensuel';
      case 'YEARLY': return 'Annuel';
      default: return freq;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Factures Récurrentes</h2>
          <p className="text-slate-500">Gérez les abonnements de vos clients.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleRunNow}
            disabled={isRunning}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Génération...' : 'Générer échéances'}
          </button>
          <button 
            onClick={onCreate}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel Abonnement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px] md:min-w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-medium text-slate-500">Label</th>
                <th className="py-4 px-6 font-medium text-slate-500">Client</th>
                <th className="py-4 px-6 font-medium text-slate-500">Fréquence</th>
                <th className="py-4 px-6 font-medium text-slate-500">Prochaine Échéance</th>
                <th className="py-4 px-6 font-medium text-slate-500">Montant HT</th>
                <th className="py-4 px-6 font-medium text-slate-500">Statut</th>
                <th className="py-4 px-6 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recurringInvoices.map((rec) => {
                const subtotal = rec.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6 font-medium text-slate-900">
                        {rec.label}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{getClientName(rec.clientId)}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {getFrequencyLabel(rec.frequency)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {rec.nextRunDate}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">{subtotal.toFixed(2)} €</td>
                    <td className="py-4 px-6">
                      {rec.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium px-2 py-1 bg-emerald-50 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium px-2 py-1 bg-slate-100 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onToggleActive(rec)}
                          title={rec.isActive ? "Désactiver" : "Activer"}
                          className={`p-1.5 rounded transition-colors ${rec.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onEdit(rec)}
                          title="Modifier"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {recurringInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune facture récurrente configurée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
