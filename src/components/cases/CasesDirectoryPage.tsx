import React, { useState, useMemo } from 'react';
import { Database, Search, Filter, Layers, ArrowUpDown, ArrowRight, Download, Server, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface CasesDirectoryPageProps {
  cases: DiagnosticCase[];
  onSelectCase: (caseId: string) => void;
  onExportPdf: (c: DiagnosticCase) => void;
}

export const CasesDirectoryPage: React.FC<CasesDirectoryPageProps> = ({
  cases,
  onSelectCase,
  onExportPdf
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'id' | 'severity' | 'category' | 'status'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cases.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return ['All', ...Array.from(cats)];
  }, [cases]);

  // Filter & Sort
  const filteredAndSortedCases = useMemo(() => {
    return cases
      .filter(c => {
        const q = searchTerm.toLowerCase();
        const matchSearch = 
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.networkProblem.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.networkEvidence?.hostname && c.networkEvidence.hostname.toLowerCase().includes(q));

        const matchSev = severityFilter === 'All' || c.severity === severityFilter;
        const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
        const matchStatus = statusFilter === 'All' || c.status === statusFilter;

        return matchSearch && matchSev && matchCat && matchStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id') {
          cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
        } else if (sortField === 'severity') {
          const weights: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          cmp = (weights[b.severity] || 0) - (weights[a.severity] || 0);
        } else if (sortField === 'category') {
          cmp = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'status') {
          cmp = (a.status || '').localeCompare(b.status || '');
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [cases, searchTerm, severityFilter, categoryFilter, statusFilter, sortField, sortAsc]);

  const handleSort = (field: 'id' | 'severity' | 'category' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">Cases Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Authoritative Diagnostic Cases
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and query all 35 authoritative Cisco Packet Tracer test cases across Wireless, VLAN, Routing, DHCP, DNS, ACL, and NAT.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-[#0B1728] px-3.5 py-2 rounded-xl border border-[#162942] shadow-sm">
          <span>Showing: <strong className="text-white">{filteredAndSortedCases.length}</strong> of {cases.length} cases</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0B1728] p-4 rounded-2xl border border-[#162942] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ID, host, symptom..."
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Severity */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">Domain:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enterprise Cases Table */}
      <div className="bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#162942] bg-[#07111E] text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider select-none">
                <th 
                  onClick={() => handleSort('id')} 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Case ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Incident Title & Symptom</th>
                <th 
                  onClick={() => handleSort('severity')} 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Severity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')} 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Domain</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Host</th>
                <th className="py-3.5 px-4">OSI Layer</th>
                <th 
                  onClick={() => handleSort('status')} 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162942]/60 font-mono">
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No cases match your filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map(c => {
                  const sevBadge = 
                    c.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                    c.severity === 'High' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                    c.severity === 'Medium' ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' :
                    'bg-slate-900 text-slate-400 border-slate-800';

                  const statusBadge = 
                    c.status === 'Approved' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                    c.status === 'Rejected' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                    'bg-amber-950 text-amber-300 border-amber-500/40';

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => onSelectCase(c.id)}
                      className="hover:bg-cyan-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-white truncate font-sans">{c.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">{c.networkProblem}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase font-mono ${sevBadge}`}>
                          {c.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap font-sans">
                        {c.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {c.networkEvidence?.hostname || 'ROUTER-01'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {c.aiDiagnosis?.osiLayer || 'Layer 3'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${statusBadge}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportPdf(c);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#07111E] rounded-lg border border-transparent hover:border-slate-800 transition-colors"
                            title="Export PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCase(c.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/30 font-semibold transition-all inline-flex items-center gap-1 text-[11px]"
                          >
                            Diagnose <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
