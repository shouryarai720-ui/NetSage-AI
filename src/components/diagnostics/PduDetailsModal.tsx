import React, { useState } from 'react';
import { Layers, X, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Terminal, FileText } from 'lucide-react';

export interface PduData {
  id: string;
  protocol: 'ICMP' | 'ARP' | 'DHCP' | 'DNS' | 'TCP' | 'OSPF';
  sourceDevice: string;
  targetDevice: string;
  currentDevice: string;
  status: 'SUCCESS' | 'DROPPED' | 'FILTERED' | 'IN_TRANSIT';
  dropReason?: string;
  osiLayers: {
    layer1?: { port: string; media: string; bandwidth: string };
    layer2?: { srcMac: string; dstMac: string; vlanId?: string; etherType: string };
    layer3?: { srcIp: string; dstIp: string; ttl: number; protocolNum: number };
    layer4?: { srcPort?: number; dstPort?: number; flags?: string; seqNum?: number };
    layer7?: { type: string; info: string; payloadSummary: string };
  };
  inboundPduDetails: string[];
  outboundPduDetails?: string[];
}

interface PduDetailsModalProps {
  pdu: PduData | null;
  onClose: () => void;
}

export const PduDetailsModal: React.FC<PduDetailsModalProps> = ({ pdu, onClose }) => {
  const [activeTab, setActiveTab] = useState<'osi' | 'inbound' | 'outbound'>('osi');
  const [selectedLayer, setSelectedLayer] = useState<number>(3);

  if (!pdu) return null;

  const protocolColor = 
    pdu.protocol === 'ICMP' ? 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40' :
    pdu.protocol === 'ARP' ? 'text-amber-400 bg-amber-950/80 border-amber-500/40' :
    pdu.protocol === 'DHCP' ? 'text-orange-400 bg-orange-950/80 border-orange-500/40' :
    pdu.protocol === 'DNS' ? 'text-purple-400 bg-purple-950/80 border-purple-500/40' :
    'text-blue-400 bg-blue-950/80 border-blue-500/40';

  const isDropped = pdu.status === 'DROPPED' || pdu.status === 'FILTERED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-[#0B1728] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#07111E] border-b border-[#162942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0B1728] border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-white">
                  PACKET TRACER PDU INFORMATION
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${protocolColor}`}>
                  {pdu.protocol}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  isDropped ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}>
                  {pdu.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                At Device: <strong className="text-white">{pdu.currentDevice}</strong> • Flow: {pdu.sourceDevice} → {pdu.targetDevice}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop Reason Banner if failed */}
        {isDropped && pdu.dropReason && (
          <div className="px-5 py-3 bg-rose-950/60 border-b border-rose-500/40 text-xs font-mono text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-100 font-bold">Packet Tracer Drop Event: </strong>
              <span>{pdu.dropReason}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#162942] bg-[#07111E]/60 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('osi')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'osi'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            OSI Model Inspection
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'inbound'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Inbound PDU Details
          </button>
          {pdu.outboundPduDetails && (
            <button
              onClick={() => setActiveTab('outbound')}
              className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'outbound'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Outbound PDU Details
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'osi' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* OSI 7-Layer Selector */}
              <div className="md:col-span-5 space-y-1.5 font-mono text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  OSI Model Layers (At {pdu.currentDevice})
                </span>
                
                {[7, 4, 3, 2, 1].map(layerNum => {
                  const layerNames: Record<number, string> = {
                    7: 'Layer 7: Application',
                    4: 'Layer 4: Transport',
                    3: 'Layer 3: Network',
                    2: 'Layer 2: Data Link',
                    1: 'Layer 1: Physical'
                  };

                  const isPresent = 
                    layerNum === 7 ? !!pdu.osiLayers.layer7 :
                    layerNum === 4 ? !!pdu.osiLayers.layer4 :
                    layerNum === 3 ? !!pdu.osiLayers.layer3 :
                    layerNum === 2 ? !!pdu.osiLayers.layer2 :
                    !!pdu.osiLayers.layer1;

                  const isSelected = selectedLayer === layerNum;

                  return (
                    <button
                      key={layerNum}
                      onClick={() => setSelectedLayer(layerNum)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200 shadow-sm' 
                          : isPresent 
                          ? 'bg-[#07111E] border-[#1A3150] text-slate-300 hover:border-cyan-500/30'
                          : 'bg-[#07111E]/40 border-[#162942] text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-semibold">{layerNames[layerNum]}</span>
                      {isPresent && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Layer Specific Fields */}
              <div className="md:col-span-7 bg-[#07111E] rounded-xl border border-[#1A3150] p-4 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white uppercase">
                    Layer {selectedLayer} Field Analysis
                  </span>
                  <span className="text-[10px] text-cyan-400">Packet Tracer Simulator</span>
                </div>

                {selectedLayer === 7 && pdu.osiLayers.layer7 && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Application Protocol:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer7.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Operation / Message:</span>
                      <span className="text-white">{pdu.osiLayers.layer7.info}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 block mb-1">Payload Content:</span>
                      <div className="bg-[#040810] p-2.5 rounded-lg border border-[#162942] text-[11px] text-cyan-200">
                        {pdu.osiLayers.layer7.payloadSummary}
                      </div>
                    </div>
                  </div>
                )}

                {selectedLayer === 4 && pdu.osiLayers.layer4 && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Source Port:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer4.srcPort || 'N/A (ICMP)'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Destination Port:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer4.dstPort || 'N/A (ICMP)'}</span>
                    </div>
                    {pdu.osiLayers.layer4.flags && (
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">Flags / Type:</span>
                        <span className="text-white">{pdu.osiLayers.layer4.flags}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedLayer === 3 && pdu.osiLayers.layer3 && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Source IP Address:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer3.srcIp}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Destination IP Address:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer3.dstIp}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Time-To-Live (TTL):</span>
                      <span className="text-white">{pdu.osiLayers.layer3.ttl}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">IP Protocol Number:</span>
                      <span className="text-white">{pdu.osiLayers.layer3.protocolNum} ({pdu.protocol})</span>
                    </div>
                  </div>
                )}

                {selectedLayer === 2 && pdu.osiLayers.layer2 && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Source MAC Address:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer2.srcMac}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Destination MAC Address:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer2.dstMac}</span>
                    </div>
                    {pdu.osiLayers.layer2.vlanId && (
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">802.1Q VLAN Tag:</span>
                        <span className="text-amber-300 font-bold">VLAN {pdu.osiLayers.layer2.vlanId}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">EtherType:</span>
                      <span className="text-white">{pdu.osiLayers.layer2.etherType}</span>
                    </div>
                  </div>
                )}

                {selectedLayer === 1 && pdu.osiLayers.layer1 && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Ingress Physical Port:</span>
                      <span className="text-cyan-300 font-bold">{pdu.osiLayers.layer1.port}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Physical Media:</span>
                      <span className="text-white">{pdu.osiLayers.layer1.media}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Link Bandwidth:</span>
                      <span className="text-white">{pdu.osiLayers.layer1.bandwidth}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inbound' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#07111E] rounded-xl border border-[#1A3150] space-y-2">
                <span className="text-slate-400 block font-bold text-[11px] uppercase">
                  Hop Processing Steps (At {pdu.currentDevice})
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  {pdu.inboundPduDetails.map((detail, idx) => (
                    <li key={idx} className="p-1.5 bg-[#040810] rounded-lg border border-[#162942]/60">
                      {detail}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'outbound' && pdu.outboundPduDetails && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#07111E] rounded-xl border border-[#1A3150] space-y-2">
                <span className="text-slate-400 block font-bold text-[11px] uppercase">
                  Outbound Forwarding Decision
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  {pdu.outboundPduDetails.map((detail, idx) => (
                    <li key={idx} className="p-1.5 bg-[#040810] rounded-lg border border-[#162942]/60">
                      {detail}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#07111E] border-t border-[#162942] text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Packet Tracer Event ID: #{pdu.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0B1728] hover:bg-slate-800 text-white rounded-xl border border-[#1A3150] transition-colors font-bold"
          >
            Close PDU Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
