import React, { useState } from 'react';
import { 
  Share2, 
  Server, 
  Monitor, 
  Laptop, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Wifi, 
  Layers,
  ArrowRight,
  Radio
} from 'lucide-react';
import { DiagnosticCase } from '../../types';
import { TopologyHero } from '../diagnostics/TopologyHero';

interface NetworkHealthPageProps {
  cases: DiagnosticCase[];
  onSelectCase: (caseId: string) => void;
}

export const NetworkHealthPage: React.FC<NetworkHealthPageProps> = ({
  cases,
  onSelectCase
}) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'inventory' | 'links'>('visualizer');
  const [selectedTopologyCaseId, setSelectedTopologyCaseId] = useState<string>(cases[0]?.id || 'NET-001');

  const selectedCase = cases.find(c => c.id === selectedTopologyCaseId) || cases[0];

  // Derive device inventory from all cases
  const allNodes = cases.flatMap(c => (c.topology?.nodes || []).map(n => ({ ...n, caseId: c.id })));
  const allLinks = cases.flatMap(c => (c.topology?.links || []).map(l => ({ ...l, caseId: c.id })));

  const routers = allNodes.filter(n => n.type === 'Router');
  const switches = allNodes.filter(n => n.type === 'Switch');
  const servers = allNodes.filter(n => n.type === 'Server');
  const pcs = allNodes.filter(n => n.type === 'PC');

  const failedLinks = allLinks.filter(l => l.status === 'failed');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">Network Lab</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Network Topology & Packet Tracer Visualizer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive Cisco simulation topologies, live packet probing, OSI 7-layer PDU analysis, and device inventory telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-xs">
            ● CISCO PACKET TRACER SIMULATION ENGINE
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono">Routers</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{routers.length} Nodes</div>
          <p className="text-[11px] text-slate-400 mt-1">Cisco 2901 / 2911 Gateways</p>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono">Switches</span>
            <Share2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{switches.length} Nodes</div>
          <p className="text-[11px] text-slate-400 mt-1">Catalyst 2960 / 3560 L2/L3</p>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono">Endpoints</span>
            <Laptop className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{servers.length + pcs.length} Endpoints</div>
          <p className="text-[11px] text-slate-400 mt-1">DHCP, DNS, Auth & Clients</p>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono">Simulated Faults</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{failedLinks.length} Outages</div>
          <p className="text-[11px] text-slate-400 mt-1">Pending Remediation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`px-5 py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'visualizer'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Interactive Packet Tracer Lab</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Device Node Inventory ({allNodes.length})
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`px-5 py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'links'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Simulated Fault Links ({failedLinks.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'visualizer' && selectedCase && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0B1728] p-3 rounded-xl border border-[#162942] font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Select Simulation Topology:</span>
              <select
                value={selectedTopologyCaseId}
                onChange={e => setSelectedTopologyCaseId(e.target.value)}
                className="bg-[#07111E] border border-[#1A3150] text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-mono"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.title} ({c.severity})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onSelectCase(selectedCase.id)}
              className="px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-900/60 transition-colors font-bold text-xs flex items-center gap-1.5"
            >
              <span>Inspect Incident Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <TopologyHero
            nodes={selectedCase.topology?.nodes || []}
            links={selectedCase.topology?.links || []}
            caseId={selectedCase.id}
            targetHostname={selectedCase.networkEvidence?.hostname}
          />
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#162942] bg-[#07111E] text-[11px] font-bold font-mono text-slate-400 uppercase">
                  <th className="py-3.5 px-4">Device Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">VLAN</th>
                  <th className="py-3.5 px-4">Interfaces</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Parent Case</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162942]/60 font-mono">
                {allNodes.slice(0, 15).map((node, idx) => (
                  <tr key={`${node.id}-${idx}`} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{node.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{node.type}</td>
                    <td className="py-3.5 px-4 text-cyan-400 font-semibold">{node.ip}</td>
                    <td className="py-3.5 px-4 text-slate-400">{node.vlan || 'Default'}</td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-300">
                      {node.interfaces.join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        node.status === 'failed' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                        node.status === 'warning' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                        'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400 font-bold">{node.caseId}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectCase(node.caseId)}
                        className="px-2.5 py-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm p-6">
          <div className="space-y-3">
            {failedLinks.map((link, idx) => (
              <div 
                key={idx}
                className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-900 border border-rose-500/40 text-rose-200 rounded-lg">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      Link Outage: {link.source} ↔ {link.target}
                    </div>
                    <div className="text-[11px] text-rose-300/80 mt-0.5">
                      Bandwidth: {link.bandwidth || '1 Gbps'} • Associated with Case {link.caseId}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCase(link.caseId)}
                  className="px-3.5 py-1.5 bg-[#07111E] hover:bg-rose-950 text-rose-300 border border-rose-500/40 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Diagnose Fault <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
