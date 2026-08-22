import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Layers, AlertCircle, ArrowRight, Server, Terminal, Shield, Hash } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: DiagnosticCase[];
  onSelectCase: (caseId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cases,
  onSelectCase
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered cases based on multi-attribute search
  const filteredCases = useMemo(() => {
    if (!query.trim()) return cases.slice(0, 8); // show recent / popular 8
    const q = query.toLowerCase().trim();

    return cases.filter(c => {
      const matchId = c.id.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchProblem = c.networkProblem.toLowerCase().includes(q);
      const matchCategory = c.category.toLowerCase().includes(q);
      const matchHost = c.networkEvidence?.hostname?.toLowerCase().includes(q);
      const matchEvidence = c.networkEvidence?.showCommandOutput?.toLowerCase().includes(q);
      const matchNodes = c.topology?.nodes?.some(n => 
        n.name.toLowerCase().includes(q) || 
        n.ip.toLowerCase().includes(q) ||
        (n.vlan && n.vlan.toLowerCase().includes(q)) ||
        n.interfaces.some(i => i.toLowerCase().includes(q))
      );
      const matchOsi = c.aiDiagnosis?.osiLayer?.toLowerCase().includes(q);
      const matchFix = c.aiDiagnosis?.fixSteps?.some(f => f.toLowerCase().includes(q));

      return matchId || matchTitle || matchProblem || matchCategory || matchHost || matchEvidence || matchNodes || matchOsi || matchFix;
    });
  }, [cases, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0B1728] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#162942] bg-[#07111E] gap-3">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Case ID (e.g. NET-001), IP, VLAN, device, interface, symptom..."
            className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-sm font-medium font-sans"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-[#0B1728] border border-[#1A3150] text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-mono shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Quick Filter Tags */}
        <div className="px-4 py-2.5 border-b border-[#162942] bg-[#07111E]/50 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-medium text-[11px] text-slate-400 font-mono">Quick filters:</span>
          {['VLAN', 'Routing', 'DHCP', 'ACL', 'NAT', 'Wireless', 'Critical'].map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-0.5 rounded-full bg-[#0B1728] border border-[#1A3150] hover:border-cyan-500 hover:text-cyan-300 text-slate-300 text-[11px] font-mono transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#162942]/60">
          {filteredCases.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No diagnostic cases matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Try searching for a Case ID (e.g. NET-012), IP address, or interface name.</p>
            </div>
          ) : (
            filteredCases.map(c => {
              const sevBadge = 
                c.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                c.severity === 'High' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                c.severity === 'Medium' ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' :
                'bg-slate-900 text-slate-400 border-slate-800';

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCase(c.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-cyan-950/20 transition-colors group flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap font-mono">
                      <span className="font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        {c.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${sevBadge}`}>
                        {c.severity}
                      </span>
                      <span className="text-[11px] text-slate-300 font-sans font-medium">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.aiDiagnosis?.osiLayer}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-cyan-300">
                      {c.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                      {c.networkProblem}
                    </p>

                    {/* Nodes Preview */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span>Host: <strong className="text-slate-200">{c.networkEvidence?.hostname}</strong></span>
                      <span>•</span>
                      <span>Nodes: {c.topology?.nodes?.map(n => n.name).slice(0, 3).join(', ')}</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 mt-2 transition-transform group-hover:translate-x-1" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#07111E] border-t border-[#162942] text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Showing <strong className="text-white">{filteredCases.length}</strong> of {cases.length} authoritative cases</span>
          <span className="text-cyan-400">NetSage AI Case Catalog</span>
        </div>
      </div>
    </div>
  );
};
