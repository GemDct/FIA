import React from 'react';
import { Invoice, InvoiceStatus, Client } from '../types';
import { MoreHorizontal, Printer, Edit, CheckCircle, Plus, Sparkles } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onCreate: () => void;
  onOpenAI: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  clients, 
  onEdit, 
  onView,
  onCreate,
  onOpenAI 
}) => {
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown Client';

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-emerald-100 text-emerald-700';
      case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-700';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Factures</h2>
          <p className="text-slate-500">Gérez votre facturation client.</p>
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
            Nouvelle Facture
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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6 font-medium text-slate-900">{invoice.number}</td>
                  <td className="py-4 px-6 text-slate-600">{getClientName(invoice.clientId)}</td>
                  <td className="py-4 px-6 text-slate-600">{invoice.date}</td>
                  <td className="py-4 px-6 font-medium text-slate-900">{invoice.total.toFixed(2)} €</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => onView(invoice)} 
                        title="Voir / Imprimer"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(invoice)} 
                        title="Modifier"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune facture trouvée. Créez votre première facture !
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