import React from 'react';
import PrintButton from './PrintButton';
import '../styles/print.css';

export type BrandSettings = {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string; // hex or css var
  secondaryColor?: string;
  headerStyle?: 'solid' | 'gradient' | 'minimal';
  terms?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type ClientInfo = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type ScopeItem = {
  id: string;
  trade?: string; // e.g., Framing, Electrical
  description: string;
  quantity?: number;
  unit?: string; // e.g., sq ft, lf, ea
  unitPrice?: number; // in USD or selected currency
  include?: boolean; // flag for included vs excluded
};

export type ProposalData = {
  id?: string;
  title: string;
  projectAddress?: string;
  date?: string;
  client: ClientInfo;
  items: ScopeItem[];
  subtotal?: number; // optional override
  taxRate?: number; // e.g., 0.0775
  discount?: number; // flat discount amount
  notes?: string;
};

export type ProposalPreviewProps = {
  brand?: BrandSettings;
  proposal: ProposalData;
  currency?: string; // default USD
  className?: string;
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function computeTotals(proposal: ProposalData) {
  const lineSubtotal = proposal.items
    .filter((it) => it.include !== false)
    .reduce((sum, it) => {
      const qty = it.quantity ?? 1;
      const price = it.unitPrice ?? 0;
      return sum + qty * price;
    }, 0);
  const subtotal = proposal.subtotal ?? lineSubtotal;
  const discount = proposal.discount ?? 0;
  const taxableBase = Math.max(subtotal - discount, 0);
  const taxRate = proposal.taxRate ?? 0;
  const tax = taxableBase * taxRate;
  const total = taxableBase + tax;
  return { subtotal, discount, taxRate, tax, total };
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({ brand, proposal, currency = 'USD', className = '' }) => {
  const { subtotal, discount, taxRate, tax, total } = computeTotals(proposal);
  const headerBg = brand?.headerStyle === 'gradient'
    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
    : brand?.headerStyle === 'minimal'
      ? 'bg-white'
      : 'bg-blue-600';
  const primary = brand?.primaryColor ?? '#1d4ed8';

  return (
    <div className={`preview-root proposal-preview max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Toolbar - hidden in print */}
      <div className="print-hidden flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">Preview • {proposal.title}</div>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Branded Header */}
      <div className={`brand-header ${headerBg} text-white rounded-md overflow-hidden`}>
        <div className="flex items-center gap-4 p-4">
          {brand?.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={`${brand.companyName ?? 'Company'} logo`}
              className="h-12 w-auto object-contain bg-white rounded-sm p-1"
            />
          ) : null}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold leading-tight">
              {brand?.companyName ?? 'Your Company Name'}
            </h1>
            <div className="text-xs opacity-90">
              {brand?.addressLine1}
              {brand?.addressLine2 ? ` • ${brand.addressLine2}` : ''}
              {brand?.phone ? ` • ${brand.phone}` : ''}
              {brand?.email ? ` • ${brand.email}` : ''}
              {brand?.website ? ` • ${brand.website}` : ''}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="opacity-90">Date</div>
            <div className="font-medium">{proposal.date ?? new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Title & Client */}
      <section className="proposal-section mt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: primary }}>{proposal.title}</h2>
            {proposal.projectAddress ? (
              <div className="text-sm text-gray-600">{proposal.projectAddress}</div>
            ) : null}
          </div>
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200 min-w-[240px]">
            <div className="text-xs text-gray-500">Client</div>
            <div className="font-medium">{proposal.client.name ?? 'Client Name'}</div>
            {proposal.client.company ? (
              <div className="text-sm text-gray-700">{proposal.client.company}</div>
            ) : null}
            {proposal.client.email ? (
              <div className="text-sm text-gray-700">{proposal.client.email}</div>
            ) : null}
            {proposal.client.phone ? (
              <div className="text-sm text-gray-700">{proposal.client.phone}</div>
            ) : null}
            {proposal.client.address ? (
              <div className="text-sm text-gray-700">{proposal.client.address}</div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Scope Table */}
      <section className="proposal-section mt-6">
        <h3 className="text-lg font-semibold mb-2" style={{ color: primary }}>Scope of Work</h3>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b border-gray-200 w-[18%]">Trade</th>
                <th className="text-left p-3 border-b border-gray-200">Description</th>
                <th className="text-right p-3 border-b border-gray-200 w-[10%]">Qty</th>
                <th className="text-right p-3 border-b border-gray-200 w-[12%]">Unit Price</th>
                <th className="text-right p-3 border-b border-gray-200 w-[12%]">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {proposal.items.filter(it => it.include !== false).map((it) => {
                const qty = it.quantity ?? 1;
                const unitPrice = it.unitPrice ?? 0;
                const line = qty * unitPrice;
                return (
                  <tr key={it.id}>
                    <td className="p-3 align-top border-b border-gray-100">{it.trade ?? '-'}</td>
                    <td className="p-3 align-top border-b border-gray-100 whitespace-pre-wrap">{it.description}</td>
                    <td className="p-3 align-top border-b border-gray-100 text-right">{qty}{it.unit ? ` ${it.unit}` : ''}</td>
                    <td className="p-3 align-top border-b border-gray-100 text-right">{formatMoney(unitPrice, currency)}</td>
                    <td className="p-3 align-top border-b border-gray-100 text-right">{formatMoney(line, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals */}
      <section className="summary mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {proposal.notes}
        </div>
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <span>Subtotal</span>
            <span className="font-medium">{formatMoney(subtotal, currency)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <span>Discount</span>
              <span className="font-medium">-{formatMoney(discount, currency)}</span>
            </div>
          ) : null}
          {taxRate > 0 ? (
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span className="font-medium">{formatMoney(tax, currency)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between p-3 bg-gray-50">
            <span className="font-semibold">Total</span>
            <span className="font-semibold" style={{ color: primary }}>{formatMoney(total, currency)}</span>
          </div>
        </div>
      </section>

      {/* Terms & Signature */}
      <section className="terms mt-8">
        <h3 className="text-lg font-semibold mb-2" style={{ color: primary }}>Terms & Conditions</h3>
        <div className="text-sm text-gray-700 whitespace-pre-wrap border border-gray-200 rounded-md p-3">
          {brand?.terms ?? 'Payment terms: Net 30. Proposal valid for 30 days unless otherwise stated. Work to be scheduled upon receipt of signed approval and initial payment as specified. Any changes to scope may impact price and schedule.'}
        </div>
        <div className="signature-block mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="h-16 border-b border-gray-300" />
            <div className="text-sm text-gray-600 mt-1">Client Signature • Date</div>
          </div>
          <div>
            <div className="h-16 border-b border-gray-300" />
            <div className="text-sm text-gray-600 mt-1">Authorized Signature • Date</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProposalPreview;

