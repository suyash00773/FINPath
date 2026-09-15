import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Percent,
  Clock,
  CheckCircle2,
  Building,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import { FinancialProduct } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface ProductsViewProps {
  products: FinancialProduct[];
  onSelectProduct?: (product: FinancialProduct) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onSelectProduct }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredProducts = products.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.partnerEcosystem.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Verified Financial Catalog</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Deterministic Product Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            FinPath never hallucinates loan interest rates or fake approval odds. Every product displayed is verified against partner rate tables and ecosystem integrations like Paytm Financial Services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Rate Verification Active</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs w-full sm:w-auto">
          {['all', 'loan', 'savings', 'insurance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                filterType === tab
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Products' : tab === 'loan' ? 'Business Loans' : tab === 'savings' ? 'Liquid Savings' : 'Term Protection'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider or loan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {product.provider}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  product.partnerEcosystem === 'Paytm Verified'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {product.partnerEcosystem}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base mt-2">
                {product.name}
              </h3>

              {/* Rate & APR highlight */}
              <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Interest Rate</div>
                  <div className="text-xl font-black text-slate-900">
                    {product.type === 'insurance' ? 'Term Shield' : `${product.interestRate}% p.a.`}
                  </div>
                </div>
                {product.apr > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-medium">True APR</div>
                    <div className="text-xs font-bold text-slate-700">{product.apr}% p.a.</div>
                    <div className="text-[9px] text-slate-400">incl. {product.processingFee}% fee</div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tenure Window:</span>
                  <span className="font-semibold text-slate-800">
                    {product.tenureMonthsMin} - {product.tenureMonthsMax} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Range:</span>
                  <span className="font-semibold text-slate-800">
                    {formatINR(product.minAmount)} - {formatINR(product.maxAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <strong>Eligibility:</strong> {product.eligibility}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {product.features.map((f, i) => (
                  <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Verified: {formatDate(product.lastVerifiedAt)}</span>
              <span className="font-bold text-blue-600">Fiduciary Linked</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
