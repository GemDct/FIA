
import React from 'react';
import { UserSubscription, UserUsage, SubscriptionPlan } from '../types';
import { Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface AccountSubscriptionPageProps {
  subscription: UserSubscription;
  usage: UserUsage;
  plan: SubscriptionPlan;
  onUpgradeClick: () => void;
  onCancelClick: () => void;
}

export const AccountSubscriptionPage: React.FC<AccountSubscriptionPageProps> = ({
  subscription,
  usage,
  plan,
  onUpgradeClick,
  onCancelClick
}) => {
  
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Helpers for progress bars
  const renderUsageBar = (label: string, current: number, max: number | undefined) => {
    const isUnlimited = max === undefined;
    const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
    
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-slate-500">
            {current} / {isUnlimited ? 'Illimité' : max}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full ${percentage > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
            style={{ width: isUnlimited ? '100%' : `${percentage}%` }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Mon Abonnement</h2>

      {/* Plan Details Card */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-slate-900">Plan {plan.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${subscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {subscription.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {(plan.pricePerMonthCents / 100).toFixed(2)}€ / mois
            </p>
          </div>
          <div className="flex gap-3">
             {plan.id !== 'business' && (
                <button 
                  onClick={onUpgradeClick}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Mettre à niveau
                </button>
             )}
             {subscription.planId !== 'free' && !subscription.cancelAtPeriodEnd && (
                <button 
                  onClick={onCancelClick}
                  className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Résilier
                </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Facturation
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Prochain renouvellement</span>
                <span className="font-medium text-slate-900">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moyen de paiement</span>
                <span className="font-medium text-slate-900">Visa •••• 4242</span>
              </div>
            </div>
            {subscription.cancelAtPeriodEnd && (
               <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Votre abonnement se terminera le {formatDate(subscription.currentPeriodEnd)}.</p>
               </div>
            )}
          </div>

          <div>
             <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Consommation (Période en cours)
            </h4>
            
            {renderUsageBar("Factures créées", usage.invoicesCreatedCurrentMonth, plan.limits.maxInvoicesPerMonth)}
            {renderUsageBar("Clients totaux", usage.clientsCreatedTotal, plan.limits.maxClients)}
            {renderUsageBar("Factures récurrentes", usage.recurringInvoicesCreatedTotal, plan.limits.maxRecurringInvoices)}
            
          </div>
        </div>
      </div>
    </div>
  );
};
