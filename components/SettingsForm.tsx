import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { Save, Building, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Input, Textarea, Checkbox } from './FormElements';

interface SettingsFormProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ settings: initialSettings, onSave }) => {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuration Entreprise</h2>
          <p className="text-slate-500">Ces informations apparaîtront sur vos factures.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Logo Section */}
          <div className="col-span-1 md:col-span-2 border-b border-slate-100 pb-6 mb-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Logo de l'entreprise</label>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden group">
                {settings.logoUrl ? (
                  <>
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    <button 
                      onClick={handleRemoveLogo}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label 
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer un logo
                </label>
                <p className="mt-2 text-xs text-slate-500">Format recommandé : PNG ou JPG (Max 2Mo)</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <Input
              label="Nom de l'entreprise"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Adresse complète"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Input
              label="Email de contact"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Téléphone"
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-6 mt-2">
            <h3 className="font-medium text-slate-900 mb-4">Informations Légales & Fiscales</h3>
          </div>

          <div>
            <Input
              label="SIRET / SIREN"
              type="text"
              value={settings.siret}
              onChange={(e) => handleChange('siret', e.target.value)}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Checkbox
              id="isVatSubject"
              label="Assujetti à la TVA"
              description="Décochez si vous êtes en franchise de TVA (ex: Auto-entrepreneur)."
              checked={settings.isVatSubject}
              onChange={(e) => handleChange('isVatSubject', e.target.checked)}
            />
          </div>

          {settings.isVatSubject && (
             <div>
              <Input
                label="Numéro TVA Intracommunautaire"
                type="text"
                value={settings.vatNumber || ''}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
              />
            </div>
          )}

           <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Mentions de paiement (RIB, IBAN...)"
              value={settings.paymentRib || ''}
              onChange={(e) => handleChange('paymentRib', e.target.value)}
              rows={3}
              className="font-mono text-sm"
              placeholder="IBAN: FR76 ..."
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <Input
              label="Conditions de paiement"
              type="text"
              value={settings.paymentTerms || ''}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              placeholder="Ex: 30 jours fin de mois"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onSave(settings)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};