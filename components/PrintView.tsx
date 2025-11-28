import React, { useState } from 'react';
import { Invoice, Client, CompanySettings } from '../types';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface PrintViewProps {
  invoice: Invoice;
  client: Client | undefined;
  settings: CompanySettings;
  onClose: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ invoice, client, settings, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const url = await api.pdf.generateUrl(invoice, settings);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.type === 'QUOTE' ? 'Devis' : 'Facture'}-${invoice.number}.html`; // Downloading HTML for now as mock
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto">
      {/* Toolbar - Hidden on print */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur text-white p-4 flex justify-between items-center no-print shadow-lg">
        <h2 className="font-medium">Aperçu Avant Impression</h2>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
            <X className="w-4 h-4" /> Fermer
          </button>
          
          <button 
            onClick={handleDownloadPdf} 
            disabled={isDownloading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Télécharger PDF (HTML)
          </button>
          
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="max-w-[21cm] mx-auto bg-white mt-20 mb-20 p-16 print:m-0 print:p-0 print:shadow-none shadow-2xl min-h-[29.7cm]">
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex-1">
             {settings.logoUrl && (
               <div className="mb-6">
                 <img src={settings.logoUrl} alt="Logo Entreprise" className="h-20 w-auto object-contain" />
               </div>
             )}
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{invoice.type === 'QUOTE' ? 'DEVIS' : 'FACTURE'}</h1>
            <p className="text-slate-500 font-medium">{invoice.number}</p>
            <div className="mt-4 inline-block px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded">
              {invoice.status}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-slate-800 mb-1">{settings.name}</div>
            <div className="text-slate-500 text-sm leading-relaxed">
              {settings.address}<br />
              SIRET: {settings.siret}<br />
              {settings.email}
            </div>
          </div>
        </div>

        {/* Client & Dates */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Facturé à</h3>
            <div className="text-slate-800 font-semibold text-lg mb-1">{client?.name || 'Client Inconnu'}</div>
            <div className="text-slate-600 text-sm whitespace-pre-line">{client?.address}</div>
            {client?.siret && <div className="text-slate-500 text-sm mt-2">SIRET: {client.siret}</div>}
          </div>
          <div className="text-right space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date d'émission</h3>
              <div className="text-slate-800 font-medium">{invoice.date}</div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date d'échéance</h3>
              <div className="text-slate-800 font-medium">{invoice.dueDate || '-'}</div>
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-12">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="text-left py-3 font-bold text-slate-600 text-sm w-1/2">Description</th>
              <th className="text-right py-3 font-bold text-slate-600 text-sm">Qté</th>
              <th className="text-right py-3 font-bold text-slate-600 text-sm">Prix Unitaire</th>
              <th className="text-right py-3 font-bold text-slate-600 text-sm">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-4 text-slate-800 text-sm">{item.description}</td>
                <td className="py-4 text-right text-slate-600 text-sm">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600 text-sm">{item.price.toFixed(2)} €</td>
                <td className="py-4 text-right text-slate-800 font-medium text-sm">{(item.quantity * item.price).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total HT</span>
              <span className="text-slate-800 font-bold">{invoice.subtotal.toFixed(2)} €</span>
            </div>
            {settings.isVatSubject && (
               <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">TVA</span>
                <span className="text-slate-800 font-bold">{invoice.taxAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-b-2 border-slate-800">
              <span className="text-slate-900 font-bold text-lg">Total TTC</span>
              <span className="text-slate-900 font-bold text-lg">{invoice.total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        {invoice.notes && (
          <div className="bg-slate-50 p-6 rounded-lg mb-8">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Notes</h3>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}

        <div className="text-center text-slate-400 text-xs mt-auto pt-12 border-t border-slate-100">
          Merci de votre confiance. Paiement dû avant la date d'échéance.
        </div>
      </div>
    </div>
  );
};