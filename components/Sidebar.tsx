
import React from 'react';
import { LayoutDashboard, FileText, Users, Settings, PlusCircle, Sparkles, Package, Repeat, FileSpreadsheet, LogOut, Briefcase, X, CreditCard, Bot } from 'lucide-react';
import { ViewState, User, SubscriptionPlan } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAIClick: () => void;
  onLogout: () => void;
  user: User | null;
  currentPlan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onAIClick, onLogout, user, currentPlan, isOpen, onClose }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'INVOICES', label: 'Factures', icon: FileText },
    { id: 'QUOTES', label: 'Devis', icon: FileSpreadsheet },
    { id: 'RECURRING_INVOICES', label: 'Récurrent', icon: Repeat },
    { id: 'AI_ASSISTANT', label: 'Assistant IA', icon: Bot },
    { id: 'PRODUCTS', label: 'Produits', icon: Package },
    { id: 'SERVICES', label: 'Services', icon: Briefcase },
    { id: 'CLIENTS', label: 'Clients', icon: Users },
    { id: 'SETTINGS', label: 'Paramètres', icon: Settings },
  ];

  const handleNavClick = (view: ViewState) => {
    onChangeView(view);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <div className={`
        fixed top-0 left-0 bottom-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col 
        transition-transform duration-300 ease-in-out no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">FastInvoice</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => { onChangeView('CREATE_INVOICE'); onClose(); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="truncate">Nouvelle Facture</span>
          </button>
          
          <button
            onClick={() => { handleNavClick('AI_ASSISTANT'); }}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Assistant IA</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id as ViewState)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-slate-100 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Subscription & User Section */}
        <div className="p-4 border-t border-slate-100">
           {currentPlan && (
            <button
              onClick={() => handleNavClick('ACCOUNT_SUBSCRIPTION')}
              className="w-full mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentPlan.id === 'free' ? 'bg-slate-400' : 'bg-amber-400'}`} />
                <span className="text-xs font-semibold text-slate-700 uppercase">Plan {currentPlan.name}</span>
              </div>
              <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-4">
             {user?.avatarUrl ? (
               <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full" />
             ) : (
               <div className="w-8 h-8 rounded-full bg-slate-200" />
             )}
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Utilisateur'}</p>
               <p className="text-xs text-slate-500 truncate">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
};
