import React, { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Calendar, Send } from 'lucide-react';
import { Client, Invoice, InvoiceItem, InvoiceStatus, Product, Service, DocumentType, CompanySettings } from '../types';
import { api } from '../services/api';
import { Input, Select, Textarea, baseInputStyles } from './FormElements';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface InvoiceFormProps {
  clients: Client[];
  products: Product[];
  services: Service[];
  settings: CompanySettings;
  initialData?: Partial<Invoice> | null;
  documentType?: DocumentType;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  clients, 
  products, 
  services,
  settings,
  initialData, 
  documentType = 'INVOICE', 
  onSave, 
  onCancel 
}) => {
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [{ id: generateId(), description: '', quantity: 1, price: 0, vatRate: settings.isVatSubject ? 20 : 0 }]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [number, setNumber] = useState(initialData?.number || `${documentType === 'QUOTE' ? 'DEV' : 'INV'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [recurringFrequency, setRecurringFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined>((initialData as any)?.recurringFrequency);
  const [isSending, setIsSending] = useState(false);

  // Totals Calculation
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = item.quantity * item.price;
      subtotal += lineTotal;
      if (settings.isVatSubject) {
        taxAmount += lineTotal * (item.vatRate / 100);
      }
    });

    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleAddItem = () => {
    setItems([...items, { id: generateId(), description: '', quantity: 1, price: 0, vatRate: settings.isVatSubject ? 20 : 0 }]);
  };

  const handleSourceSelect = (index: number, sourceId: string, type: 'PRODUCT' | 'SERVICE') => {
    const newItems = [...items];
    if (type === 'PRODUCT') {
      const product = products.find(p => p.id === sourceId);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          description: product.name,
          price: product.defaultPrice,
          vatRate: settings.isVatSubject ? product.vatRate : 0,
          productId: product.id,
          serviceId: undefined
        };
      }
    } else {
      const service = services.find(s => s.id === sourceId);
      if (service) {
        newItems[index] = {
          ...newItems[index],
          description: service.name,
          price: service.unitPrice,
          vatRate: settings.isVatSubject ? service.vatRate : 0,
          serviceId: service.id,
          productId: undefined
        };
      }
    }
    setItems(newItems);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (status: InvoiceStatus) => {
    if (!clientId) {
      alert('Veuillez sélectionner un client');
      return;
    }

    const invoice: Invoice = {
      id: initialData?.id || generateId(),
      type: documentType as DocumentType,
      number,
      date,
      dueDate: (documentType as string) === 'RECURRING' ? undefined : dueDate,
      clientId,
      items,
      status,
      notes,
      subtotal,
      taxAmount,
      total
    };

    if (status === InvoiceStatus.SENT) {
      setIsSending(true);
      const client = clients.find(c => c.id === clientId);
      if (client) await api.email.sendInvoice(invoice, client.email);
      setIsSending(false);
    }

    onSave(invoice);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {initialData?.id ? 'Modifier' : 'Nouveau'} {documentType === 'QUOTE' ? 'Devis' : (documentType as string) === 'RECURRING' ? 'Modèle Récurrent' : 'Facture'}
            </h2>
             <span className="text-sm text-slate-500">{number}</span>
          </div>
        </div>
        <div className="text-left md:text-right bg-slate-50 p-3 rounded-lg md:bg-transparent md:p-0">
          <div className="text-sm text-slate-500">Total TTC</div>
          <div className="text-2xl font-bold text-indigo-600">{total.toFixed(2)} €</div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <Input
              label="Numéro"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Date d'émission"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
          
          {(documentType as string) === 'RECURRING' ? (
             <div>
              <Select
                label="Fréquence"
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as any)}
              >
                <option value="MONTHLY">Mensuel</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="YEARLY">Annuel</option>
              </Select>
            </div>
          ) : (
            <div>
              <Input
                label="Date d'échéance"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          )}
        </div>

        {/* Client Selection */}
        <div>
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </Select>
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Éléments</label>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                {/* Catalog Select */}
                <div className="w-full md:w-48">
                   <select 
                      className={baseInputStyles}
                      onChange={(e) => {
                         const val = e.target.value;
                         if(!val) return;
                         const [type, id] = val.split(':');
                         handleSourceSelect(idx, id, type as 'PRODUCT' | 'SERVICE');
                      }}
                      value={item.productId ? `PRODUCT:${item.productId}` : item.serviceId ? `SERVICE:${item.serviceId}` : ''}
                   >
                     <option value="">Catalogue...</option>
                     <optgroup label="Produits">
                        {products.map(p => <option key={p.id} value={`PRODUCT:${p.id}`}>{p.name}</option>)}
                     </optgroup>
                     <optgroup label="Services">
                        {services.map(s => <option key={s.id} value={`SERVICE:${s.id}`}>{s.name}</option>)}
                     </optgroup>
                   </select>
                </div>

                <div className="w-full flex-grow">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className={baseInputStyles}
                  />
                </div>
                
                <div className="flex w-full md:w-auto gap-2">
                    <div className="flex-1 md:w-20">
                    <input
                        type="number"
                        placeholder="Qté"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className={`${baseInputStyles} text-right`}
                    />
                    </div>
                    <div className="flex-1 md:w-24">
                    <input
                        type="number"
                        placeholder="Prix HT"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className={`${baseInputStyles} text-right`}
                    />
                    </div>
                    {settings.isVatSubject && (
                        <div className="w-20">
                        <input
                            type="number"
                            placeholder="TVA%"
                            min="0"
                            step="0.1"
                            value={item.vatRate}
                            onChange={(e) => handleItemChange(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                            className={`${baseInputStyles} text-right bg-slate-100`}
                        />
                        </div>
                    )}
                </div>

                <div className="flex justify-between w-full md:w-auto md:block items-center">
                   <div className="md:hidden text-sm font-medium text-slate-500">Total Ligne:</div>
                   <div className="md:w-24 md:pt-3 text-right text-sm font-medium text-slate-600">
                     {((item.quantity * item.price) * (1 + (settings.isVatSubject ? item.vatRate/100 : 0))).toFixed(2)} €
                   </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-3 text-slate-400 hover:text-red-500 transition-colors self-end md:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        </div>

        {/* Footer / Totals */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
             <div className="w-full md:w-1/2">
                <Textarea
                  label="Notes / Conditions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Informations supplémentaires..."
                />
             </div>

             <div className="w-full md:w-1/3 space-y-3 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-slate-600">
                   <span>Total HT</span>
                   <span>{subtotal.toFixed(2)} €</span>
                </div>
                {settings.isVatSubject ? (
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>TVA</span>
                        <span>{taxAmount.toFixed(2)} €</span>
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 text-right italic">TVA non applicable (art. 293 B du CGI)</div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2">
                   <span>Total TTC</span>
                   <span>{total.toFixed(2)} €</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 items-center mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="w-full md:w-auto px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(InvoiceStatus.DRAFT)}
              className="w-full md:w-auto px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Brouillon
            </button>
            {(documentType as string) !== 'RECURRING' && (
              <button
                type="button"
                onClick={() => handleSubmit(InvoiceStatus.SENT)}
                disabled={isSending}
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? 'Envoi...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Valider & Envoyer
                  </>
                )}
              </button>
            )}
             {(documentType as string) === 'RECURRING' && (
              <button
                type="button"
                onClick={() => handleSubmit(InvoiceStatus.DRAFT)}
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                 <Save className="w-4 h-4" />
                 Sauvegarder Modèle
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};