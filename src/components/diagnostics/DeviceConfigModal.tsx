import React, { useState } from 'react';
import { 
  Server, 
  Share2, 
  Monitor, 
  Laptop, 
  X, 
  Terminal, 
  Sliders, 
  Activity, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { DeviceNode } from '../../types';

interface DeviceConfigModalProps {
  node: DeviceNode | null;
  onClose: () => void;
  onRunPing?: (sourceId: string, targetId: string) => void;
}

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({ node, onClose, onRunPing }) => {
  const [activeTab, setActiveTab] = useState<'interfaces' | 'cli' | 'routing' | 'arp'>('interfaces');
  const [cliInput, setCliInput] = useState('');
  const [cliLogs, setCliLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  // Derive mock Cisco IOS interface states based on node
  const getInterfaceDetails = () => {
    return node.interfaces.map((iface, index) => {
      const isDown = node.status === 'failed' && index === 0;
      return {
        name: iface,
        status: isDown ? 'down' : 'up',
        protocol: isDown ? 'down' : 'up',
        ip: index === 0 ? node.ip : 'unassigned',
        subnet: index === 0 ? '255.255.255.0' : 'N/A',
        mac: `00${index}a.42b${index}.9c0${index}`,
        speed: '1000 Mbps',
        duplex: 'Full-duplex',
        vlan: node.vlan || 'VLAN 1',
        rxPackets: Math.floor(1240 + index * 420),
        txPackets: Math.floor(1180 + index * 390)
      };
    });
  };

  // Mock CLI command responses
  const handleRunCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    let response = '';
    const lower = trimmed.toLowerCase();

    if (lower === 'show ip interface brief' || lower === 'sh ip int br') {
      response = `Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0         ${node.ip.padEnd(15)} YES manual ${node.status === 'failed' ? 'down                  down' : 'up                    up'}
GigabitEthernet0/1         unassigned      YES unset  up                    up
Vlan1                      unassigned      YES unset  administratively down down`;
    } else if (lower.startsWith('show ip route') || lower === 'sh ip ro') {
      response = `Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area

Gateway of last resort is not set

      192.168.10.0/24 is subnetted, 1 subnets
C        192.168.10.0 is directly connected, GigabitEthernet0/0
L        ${node.ip}/32 is directly connected, GigabitEthernet0/0
O     192.168.20.0/24 [110/2] via 10.0.0.2, 00:14:22, GigabitEthernet0/1`;
    } else if (lower.startsWith('show running-config') || lower === 'sh run') {
      response = `Building configuration...
Current configuration : 1842 bytes
!
version 15.4
hostname ${node.name}
!
ip routing
!
interface GigabitEthernet0/0
 ip address ${node.ip} 255.255.255.0
 duplex auto
 speed auto
!
interface GigabitEthernet0/1
 no ip address
 duplex auto
 speed auto
!
line con 0
line vty 0 4
 login
!
end`;
    } else if (lower.startsWith('show mac address-table') || lower === 'sh mac') {
      response = `          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0001.42a3.8b01    DYNAMIC     Gi0/1
  10    0050.7966.6800    DYNAMIC     Gi0/0
  20    0060.2f88.1122    DYNAMIC     Gi0/2
Total Mac Addresses for this criterion: 3`;
    } else if (lower.startsWith('ping')) {
      if (node.status === 'failed') {
        response = `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to target, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)`;
      } else {
        response = `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to target, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`;
      }
    } else {
      response = `% Invalid command or unrecognized Cisco IOS syntax at '^' marker.`;
    }

    setCliLogs(prev => [...prev, `${node.name}# ${trimmed}`, response]);
    setCliInput('');
  };

  const interfaces = getInterfaceDetails();

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(cliLogs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-[#0B1728] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#07111E] border-b border-[#162942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1728] border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              {node.type === 'Router' ? <Server className="w-5 h-5" /> :
               node.type === 'Switch' ? <Share2 className="w-5 h-5" /> :
               node.type === 'Server' ? <Server className="w-5 h-5 text-emerald-400" /> :
               <Laptop className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-white">
                  CISCO PACKET TRACER DEVICE: {node.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {node.type}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  node.status === 'failed' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                  node.status === 'warning' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                  'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}>
                  ● {node.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                IP: <strong className="text-cyan-300">{node.ip}</strong> • VLAN: {node.vlan || 'Default (VLAN 1)'}
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

        {/* Tab Header */}
        <div className="flex border-b border-[#162942] bg-[#07111E]/60 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'interfaces'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Physical & Ports ({interfaces.length})
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cli'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Cisco IOS CLI Terminal
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'routing'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Routing Table
          </button>
          <button
            onClick={() => setActiveTab('arp')}
            className={`px-5 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'arp'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ARP & MAC Table
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'interfaces' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#162942] bg-[#07111E] text-[10.5px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Port</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">MAC Address</th>
                      <th className="py-2.5 px-3">Duplex / Speed</th>
                      <th className="py-2.5 px-3 text-right">Packets Tx/Rx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#162942]/60">
                    {interfaces.map((iface, idx) => (
                      <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">{iface.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            iface.status === 'up' 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                              : 'bg-rose-950 text-rose-300 border-rose-500/40'
                          }`}>
                            {iface.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">{iface.ip}</td>
                        <td className="py-2.5 px-3 text-slate-400">{iface.mac}</td>
                        <td className="py-2.5 px-3 text-slate-300">{iface.speed}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {iface.txPackets} / {iface.rxPackets}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Interactive Cisco IOS Command Line • Preset commands available:
                </span>
                <div className="flex items-center gap-1.5">
                  {['sh ip int br', 'sh ip ro', 'sh run', 'ping 192.168.10.1'].map(shortcut => (
                    <button
                      key={shortcut}
                      onClick={() => handleRunCommand(shortcut)}
                      className="px-2 py-0.5 rounded bg-[#07111E] hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 border border-[#1A3150] text-[10px] transition-colors"
                    >
                      {shortcut}
                    </button>
                  ))}
                  {cliLogs.length > 0 && (
                    <button
                      onClick={handleCopyLogs}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy CLI Log"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Console Screen */}
              <div className="bg-[#040810] border border-[#162942] rounded-xl p-4 min-h-[220px] max-h-[300px] overflow-y-auto text-slate-200 text-[11.5px] leading-relaxed">
                <div className="text-slate-500 mb-2">
                  Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M2
                  <br />
                  Connected to {node.name} via Console Line 0.
                </div>

                {cliLogs.map((log, index) => (
                  <pre key={index} className="whitespace-pre-wrap mb-2 text-cyan-300 font-mono">
                    {log}
                  </pre>
                ))}

                {/* Input Prompt */}
                <form 
                  onSubmit={e => {
                    e.preventDefault();
                    handleRunCommand(cliInput);
                  }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <span className="text-emerald-400 font-bold">{node.name}#</span>
                  <input
                    type="text"
                    value={cliInput}
                    onChange={e => setCliInput(e.target.value)}
                    placeholder="Type Cisco command (e.g. show ip interface brief)..."
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-slate-600 text-xs"
                    autoFocus
                  />
                </form>
              </div>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#07111E] rounded-xl border border-[#1A3150] space-y-2">
                <span className="text-slate-400 block font-bold text-[11px] uppercase">
                  IP Routing Table ({node.name})
                </span>
                <pre className="text-cyan-300 bg-[#040810] p-3 rounded-lg border border-[#162942] overflow-x-auto text-[11px]">
{`Codes: L - local, C - connected, S - static, R - RIP, O - OSPF

Gateway of last resort is not set

      192.168.10.0/24 is subnetted, 1 subnets
C        192.168.10.0 is directly connected, GigabitEthernet0/0
L        ${node.ip}/32 is directly connected, GigabitEthernet0/0
O     192.168.20.0/24 [110/2] via 10.0.0.2, 00:14:22, GigabitEthernet0/1
S*    0.0.0.0/0 [1/0] via 10.0.0.1`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'arp' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#07111E] rounded-xl border border-[#1A3150] space-y-2">
                <span className="text-slate-400 block font-bold text-[11px] uppercase">
                  ARP Binding Cache ({node.name})
                </span>
                <pre className="text-cyan-300 bg-[#040810] p-3 rounded-lg border border-[#162942] overflow-x-auto text-[11px]">
{`Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  ${node.ip.padEnd(16)} -   0001.42a3.8b01  ARPA   GigabitEthernet0/0
Internet  192.168.10.100         12   0050.7966.6800  ARPA   GigabitEthernet0/0
Internet  10.0.0.2               4   0060.2f88.1122  ARPA   GigabitEthernet0/1`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#07111E] border-t border-[#162942] text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Packet Tracer Chassis: Cisco 2901 Integrated Services Router</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0B1728] hover:bg-slate-800 text-white rounded-xl border border-[#1A3150] transition-colors font-bold"
          >
            Close Device Console
          </button>
        </div>
      </div>
    </div>
  );
};
