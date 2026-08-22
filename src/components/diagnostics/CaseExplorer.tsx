import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, AlertTriangle, CheckCircle2, ChevronRight, XCircle, Database } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface CaseExplorerProps {
  cases: DiagnosticCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
}

export const CaseExplorer: React.FC<CaseExplorerProps> = ({
  cases,
  selectedCaseId,
  onSelectCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Categories extracted dynamically from cases
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cases.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return ['All', ...Array.from(cats)];
  }, [cases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = 
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.networkProblem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.networkEvidence?.hostname && c.networkEvidence.hostname.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSeverity = severityFilter === 'All' || c.severity === severityFilter;
      const matchCategory = categoryFilter === 'All' || c.category === categoryFilter;

      return matchSearch && matchSeverity && matchCategory;
    });
  }, [cases, searchTerm, severityFilter, categoryFilter]);

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm flex flex-col h-full overflow-hidden">
      {/* Explorer Header */}
      <div className="p-4 border-b border-[#162942] bg-[#07111E]/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
              Lab Case Catalog
            </h3>
          </div>
          <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
            {filteredCases.length} / {cases.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search cases, host, or symptom..."
            className="w-full bg-[#0B1728] border border-[#1A3150] focus:border-cyan-500 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-[#0E1E34] text-slate-400 border border-[#162A45] hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-medium font-mono text-[10px]">Domain:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filter by domain"
            className="flex-1 bg-[#0B1728] border border-[#1A3150] rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition-colors"
          >
            {availableCategories.map(cat => (
              <option key={cat} value={cat} className="bg-[#07111E] text-slate-200">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Case List Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#162942]/60 max-h-[680px]">
        {filteredCases.map(c => {
          const isSelected = c.id === selectedCaseId;
          const isCrit = c.severity === 'Critical';
          const isHigh = c.severity === 'High';

          return (
            <button
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-cyan-950/40 border-l-4 border-cyan-400 text-white'
                  : 'hover:bg-[#07111E]/70 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`font-mono font-bold text-xs ${isSelected ? 'text-cyan-300' : 'text-cyan-400'}`}>
                  {c.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    isCrit ? 'bg-rose-950 text-rose-300 border border-rose-600/40' :
                    isHigh ? 'bg-amber-950 text-amber-300 border border-amber-600/40' :
                    'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}>
                    {c.severity}
                  </span>

                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: c.status === 'Approved' ? '#10b981' : c.status === 'Rejected' ? '#f43f5e' : '#f59e0b'
                  }} />
                </div>
              </div>

              <div className="text-xs font-semibold line-clamp-1 text-slate-100">
                {c.title}
              </div>

              <div className="text-[11px] text-slate-400 line-clamp-1">
                {c.networkProblem}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>{c.networkEvidence?.hostname}</span>
                <span>{c.category}</span>
              </div>
            </button>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            No matching cases found for "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};
