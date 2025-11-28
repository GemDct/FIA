
import React, { useState } from 'react';
import { SubscriptionPlan, PlanId } from '../types';
import { Check, Loader2, Star } from 'lucide-react';

interface PricingPageProps {
  plans: SubscriptionPlan[];
  currentPlanId: PlanId;
  onSelectPlan: (planId: PlanId) => Promise<void>;
}

export const PricingPage: React.FC<PricingPageProps> = ({ plans, currentPlanId, onSelectPlan }) => {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSelect = async (planId: PlanId) => {
    setLoadingPlan(planId);
    await onSelectPlan(planId);
    setLoadingPlan(null);
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Choisissez votre plan</h2>
        <p className="text-slate-500">
          Évoluez à votre rythme. Changez de plan à tout moment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPro = plan.id === 'pro';
          
          return (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm flex flex-col p-6 transition-all duration-200 ${
                isCurrent ? 'ring-2 ring-indigo-600 shadow-indigo-100' : 'ring-1 ring-slate-900/5 hover:shadow-lg'
              } ${isPro ? 'md:-mt-4 md:mb-4 z-10' : ''}`}
            >
              {isPro && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                  Recommandé
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1 min-h-[40px]">{plan.description}</p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {(plan.pricePerMonthCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: plan.currency }).replace(',00', '')}
                </span>
                <span className="text-slate-500">/ mois</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={isCurrent || loadingPlan !== null}
                className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-500 cursor-default'
                    : isPro
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  'Plan Actuel'
                ) : (
                  'Choisir ce plan'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
