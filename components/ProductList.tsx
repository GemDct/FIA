import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Plus, Trash2, Edit2 } from 'lucide-react';
import { Input, Select, Textarea } from './FormElements';

interface ProductListProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const startEdit = (product?: Product) => {
    if (product) {
      setIsEditing(product.id);
      setEditForm(product);
    } else {
      setIsEditing('new');
      setEditForm({ name: '', description: '', defaultPrice: 0, vatRate: 20, unit: 'item' });
    }
  };

  const saveEdit = () => {
    if (isEditing === 'new') {
      onAdd({
        id: `prod-${Date.now()}`,
        name: editForm.name!,
        description: editForm.description || '',
        defaultPrice: Number(editForm.defaultPrice) || 0,
        vatRate: Number(editForm.vatRate) || 0,
        unit: editForm.unit || 'item'
      });
    } else if (isEditing) {
      onUpdate({ ...editForm, id: isEditing } as Product);
    }
    setIsEditing(null);
    setEditForm({});
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Catalogue Produits</h2>
          <p className="text-slate-500">Gérez vos biens physiques et stocks.</p>
        </div>
        <button 
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Produit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(product)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(product.id)} className="p-1 hover:bg-red-50 rounded text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-slate-400">{product.unit} • TVA {product.vatRate}%</span>
              <span className="text-lg font-bold text-slate-900">{product.defaultPrice} €</span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal for Add/Edit */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg">{isEditing === 'new' ? 'Ajouter un produit' : 'Modifier le produit'}</h3>
            <Input 
              placeholder="Nom" 
              value={editForm.name || ''} 
              onChange={e => setEditForm({...editForm, name: e.target.value})}
            />
            <Textarea 
              placeholder="Description" 
              value={editForm.description || ''} 
              onChange={e => setEditForm({...editForm, description: e.target.value})}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input 
                type="number" 
                className="col-span-1" 
                placeholder="Prix HT" 
                value={editForm.defaultPrice || ''} 
                onChange={e => setEditForm({...editForm, defaultPrice: Number(e.target.value)})}
              />
               <Input 
                type="number" 
                className="col-span-1" 
                placeholder="TVA %" 
                value={editForm.vatRate !== undefined ? editForm.vatRate : 20} 
                onChange={e => setEditForm({...editForm, vatRate: Number(e.target.value)})}
              />
              <Select 
                className="col-span-1" 
                value={editForm.unit || 'item'} 
                onChange={e => setEditForm({...editForm, unit: e.target.value})}
              >
                <option value="item">Unité</option>
                <option value="heure">Heure</option>
                <option value="jour">Jour</option>
                <option value="mois">Mois</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};