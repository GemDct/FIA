import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Input, Textarea, Checkbox } from './FormElements';

interface ServiceListProps {
  services: Service[];
  onAdd: (service: Service) => void;
  onUpdate: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  const startEdit = (service?: Service) => {
    if (service) {
      setIsEditing(service.id);
      setEditForm(service);
    } else {
      setIsEditing('new');
      setEditForm({ name: '', description: '', unitPrice: 0, vatRate: 20, isActive: true });
    }
  };

  const saveEdit = () => {
    if (isEditing === 'new') {
      onAdd({
        id: `srv-${Date.now()}`,
        name: editForm.name!,
        description: editForm.description || '',
        unitPrice: Number(editForm.unitPrice) || 0,
        vatRate: Number(editForm.vatRate) || 0,
        isActive: editForm.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (isEditing) {
      onUpdate({ ...editForm, id: isEditing, updatedAt: new Date() } as Service);
    }
    setIsEditing(null);
    setEditForm({});
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Services</h2>
          <p className="text-slate-500">Gérez vos prestations intellectuelles et forfaits.</p>
        </div>
        <button 
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Nouveau Service</span>
          <span className="md:hidden">Nouveau</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px] md:min-w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-medium text-slate-500">Nom</th>
                <th className="py-4 px-6 font-medium text-slate-500">Prix Unitaire</th>
                <th className="py-4 px-6 font-medium text-slate-500">TVA</th>
                <th className="py-4 px-6 font-medium text-slate-500">Actif</th>
                <th className="py-4 px-6 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map(service => (
                <tr key={service.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{service.name}</div>
                    <div className="text-slate-500 text-xs">{service.description}</div>
                  </td>
                  <td className="py-4 px-6 font-medium">{service.unitPrice} €</td>
                  <td className="py-4 px-6 text-slate-500">{service.vatRate}%</td>
                  <td className="py-4 px-6">
                    {service.isActive 
                      ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Oui</span> 
                      : <span className="text-slate-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Non</span>
                    }
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(service)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(service.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Aucun service.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg">{isEditing === 'new' ? 'Ajouter un service' : 'Modifier le service'}</h3>
            <div className="space-y-3">
              <div>
                <Input 
                  label="Nom"
                  value={editForm.name || ''} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <Textarea 
                  label="Description"
                  value={editForm.description || ''} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Input 
                    label="Prix HT"
                    type="number" 
                    value={editForm.unitPrice || ''} 
                    onChange={e => setEditForm({...editForm, unitPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Input 
                    label="Taux TVA (%)"
                    type="number" 
                    value={editForm.vatRate !== undefined ? editForm.vatRate : 20} 
                    onChange={e => setEditForm({...editForm, vatRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Checkbox 
                  id="isActive"
                  label="Service actif"
                  checked={editForm.isActive ?? true}
                  onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};