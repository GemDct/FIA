import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from './FormElements';

interface ResetPasswordScreenProps {
  token: string;
  onSuccess: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ token, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await api.auth.resetPassword(token, password);
      setIsDone(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl ring-1 ring-slate-900/5 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Mot de passe modifié</h2>
          <p className="text-slate-500 mb-6">Votre mot de passe a été mis à jour avec succès.</p>
          <button
            onClick={onSuccess}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl ring-1 ring-slate-900/5">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Réinitialisation
        </h2>
        <p className="text-center text-slate-500 mb-8">
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nouveau mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            icon={<Lock className="w-5 h-5" />}
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            icon={<Lock className="w-5 h-5" />}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};