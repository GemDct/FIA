import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, InvoiceStatus } from '../types';
import { ArrowUpRight, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  onCreateInvoice: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices, onCreateInvoice }) => {
  // Calculate statistics
  const totalRevenue = invoices
    .filter(i => i.status === InvoiceStatus.PAID)
    .reduce((acc, curr) => acc + curr.total, 0);
  
  const pendingAmount = invoices
    .filter(i => i.status === InvoiceStatus.SENT)
    .reduce((acc, curr) => acc + curr.total, 0);

  const overdueAmount = invoices
    .filter(i => i.status === InvoiceStatus.OVERDUE)
    .reduce((acc, curr) => acc + curr.total, 0);

  // Simple mock data generation for the chart based on months
  const chartData = [
    { name: 'Jan', amount: 0 },
    { name: 'Feb', amount: 1200 },
    { name: 'Mar', amount: 900 },
    { name: 'Apr', amount: 2100 },
    { name: 'May', amount: 1500 },
    { name: 'Jun', amount: 0 }, // Future
  ];

  // Update current month in chart if applicable
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const monthIdx = chartData.findIndex(d => d.name === currentMonth);
  if (monthIdx !== -1) {
    chartData[monthIdx].amount += totalRevenue;
  }

  const stats = [
    { label: 'Revenu Total', value: `${totalRevenue} €`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'En attente', value: `${pendingAmount} €`, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'En retard', value: `${overdueAmount} €`, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
          <p className="text-slate-500 mt-1">Vue d'ensemble de votre activité.</p>
        </div>
        <button onClick={onCreateInvoice} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          Créer une facture <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-80">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenus (6 derniers mois)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `${val}€`} />
            <Tooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
