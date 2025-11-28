import React, { useState } from 'react';
import { api } from '../services/api';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Input } from './FormElements';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl ring-1 ring-slate-900/5">
        <button 
          onClick={onBack}
          className="flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </button>

        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Mot de passe oublié ?
        </h2>
        
        {!isSuccess ? (
          <>
            <p className="text-center text-slate-500 mb-8">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@exemple.com"
                icon={<Mail className="w-5 h-5" />}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
              </button>
            </form>
             <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
              Note démo : Regardez la console (F12) pour voir le lien de reset généré.
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Email envoyé !</h3>
            <p className="text-slate-500 text-sm mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien dans quelques instants.
            </p>
            <button
              onClick={onBack}
              className="text-indigo-600 font-medium hover:text-indigo-800"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};