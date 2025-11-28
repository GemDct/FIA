
import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { Client, Product, Service, RecurringInvoice, InvoiceItem, CompanySettings } from '../types';
import { Input, Select, Checkbox, baseInputStyles } from './FormElements';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface RecurringInvoiceFormProps {
  clients: Client[];
  products: Product[];
  services: Service[];
  settings: CompanySettings;
  initialData?: Partial<RecurringInvoice> | null;
  onSave: (rec: RecurringInvoice) => void;
  onCancel: () => void;
}

export const RecurringInvoiceForm: React.FC<RecurringInvoiceFormProps> = ({
  clients,
  products,
  services,
  settings,
  initialData,
  onSave,
  onCancel
}) => {
  const [label, setLabel] = useState(initialData?.label || '');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>(initialData?.frequency || 'MONTHLY');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [{ id: generateId(), description: '', quantity: 1, price: 0, vatRate: settings.isVatSubject ? 20 : 0 }]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !label) {
      alert('Veuillez remplir le client et le nom de l\'abonnement');
      return;
    }

    const rec: RecurringInvoice = {
      id: initialData?.id || generateId(),
      clientId,
      label,
      frequency,
      startDate,
      endDate: endDate || undefined,
      nextRunDate: initialData?.nextRunDate || startDate, // Reset next run if new, or keep existing
      isActive,
      items
    };
    onSave(rec);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            {initialData?.id ? 'Modifier' : 'Nouvel'} Abonnement Client
          </h2>
          <p className="text-sm text-slate-500">Définissez la récurrence et le contenu de la facture.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input 
              label="Nom de l'abonnement (Référence Interne)"
              placeholder="Ex: Maintenance WordPress Client X"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

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

          <div>
             <Select
              label="Fréquence"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
            >
              <option value="MONTHLY">Mensuel</option>
              <option value="WEEKLY">Hebdomadaire</option>
              <option value="YEARLY">Annuel</option>
            </Select>
          </div>

          <div>
            <Input
              label="Date de début (et première facture)"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Date de fin (Optionnel)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
           <div className="md:col-span-2 pt-2">
            <Checkbox
              id="isActiveRec"
              label="Actif"
              description="Si désactivé, aucune facture ne sera générée automatiquement."
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        </div>

        {/* Reuse Invoice Item Logic */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Lignes à facturer</label>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
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

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
