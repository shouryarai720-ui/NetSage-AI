import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface OsiStackViewerProps {
  activeOsiLayer: string;
  detectedRuleId?: string;
}

export const OsiStackViewer: React.FC<OsiStackViewerProps> = ({
  activeOsiLayer,
  detectedRuleId
}) => {
  const osiLayers = [
    { number: 7, name: 'Application', proto: 'DNS, DHCP, HTTP', key: 'layer 7' },
    { number: 6, name: 'Presentation', proto: 'SSL/TLS, Encoding', key: 'layer 6' },
    { number: 5, name: 'Session', proto: 'RPC, NetBIOS, Sockets', key: 'layer 5' },
    { number: 4, name: 'Transport', proto: 'TCP, UDP, ACL Ports', key: 'layer 4' },
    { number: 3, name: 'Network', proto: 'IPv4/v6, OSPF, Subnets, NAT', key: 'layer 3' },
    { number: 2, name: 'Data Link', proto: 'VLAN, 802.1Q, STP, MAC', key: 'layer 2' },
    { number: 1, name: 'Physical', proto: 'Cables, Line Protocol, Port State', key: 'layer 1' }
  ];

  // Helper to determine if this layer matches active case
  const isLayerActive = (layerKey: string, layerName: string) => {
    if (!activeOsiLayer) return false;
    const lower = activeOsiLayer.toLowerCase();
    return lower.includes(layerKey) || lower.includes(layerName.toLowerCase());
  };

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            7-Layer OSI Stack Diagnostic
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Vertical Stack</span>
      </div>

      <div className="space-y-1.5">
        {osiLayers.map(l => {
          const active = isLayerActive(l.key, l.name);

          return (
            <div
              key={l.number}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-between font-mono text-xs border ${
                active
                  ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/60 font-bold shadow-md shadow-cyan-950/50'
                  : 'bg-[#07111E] text-slate-400 border-[#162942]/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  active ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  L{l.number}
                </span>

                <div>
                  <span className={`text-xs ${active ? 'text-white font-bold' : 'text-slate-300'}`}>
                    {l.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {l.proto}
                  </span>
                </div>
              </div>

              {active && (
                <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse">
                  FAULT LAYER
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
