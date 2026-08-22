import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Copy, Check, Search, Maximize2, Minimize2, RefreshCw, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';

interface CiscoCliTerminalProps {
  hostname: string;
  commandOutput: string;
  evidenceHighlight?: string;
  onRunCommand?: (cmd: string) => void;
}

export const CiscoCliTerminal: React.FC<CiscoCliTerminalProps> = ({
  hostname,
  commandOutput,
  evidenceHighlight,
  onRunCommand
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<Array<{ type: 'output' | 'input' | 'system'; text: string }>>([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Initialize output history when case output changes
  useEffect(() => {
    setHistory([
      { type: 'system', text: `TELNET session established to ${hostname || 'ROUTER-01'} (Cisco IOS Software, C2900-UNIVERSALK9-M, Version 15.4)` },
      { type: 'system', text: `Console verified. Ready for show diagnostics.` },
      { type: 'input', text: `show ip interface brief` },
      { type: 'output', text: commandOutput }
    ]);
  }, [hostname, commandOutput]);

  const handleCopy = () => {
    navigator.clipboard.writeText(commandOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    let response = '';

    // Cisco IOS Command emulator
    const cmdLower = cmd.toLowerCase();
    if (cmdLower === 'show run' || cmdLower === 'show running-config') {
      response = `! Running configuration for ${hostname}\nversion 15.4\nservice timestamps debug datetime msec\nservice timestamps log datetime msec\nno service password-encryption\n!\nhostname ${hostname}\n!\ninterface GigabitEthernet0/0\n no ip address\n duplex auto\n speed auto\n!\ninterface GigabitEthernet0/0.10\n encapsulation dot1Q 10\n ip address 10.10.10.1 255.255.255.0\n!\ninterface GigabitEthernet0/0.30\n encapsulation dot1Q 30\n ip address 10.30.30.1 255.255.255.0\n shutdown\n!\nend`;
    } else if (cmdLower.startsWith('show ip route')) {
      response = `Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP\n       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area\n\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 4 subnets, 2 masks\nC        10.10.10.0/24 is directly connected, GigabitEthernet0/0.10\nL        10.10.10.1/32 is directly connected, GigabitEthernet0/0.10\nC        10.30.30.0/24 is directly connected, GigabitEthernet0/0.30\nL        10.30.30.1/32 is directly connected, GigabitEthernet0/0.30`;
    } else if (cmdLower.startsWith('show vlan') || cmdLower.startsWith('show vlan brief')) {
      response = `VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi0/2, Gi0/3\n10   DATA_VLAN10                      active    Fa0/1, Gi0/1\n30   SERVERS_VLAN30                   active    Gi0/0.30\n99   MANAGEMENT                       active    Gi0/4`;
    } else if (cmdLower.startsWith('show ip int') || cmdLower.startsWith('show ip interface brief')) {
      response = commandOutput;
    } else if (cmdLower === 'help' || cmdLower === '?') {
      response = `Cisco IOS Emulated Diagnostic Commands:\n  show running-config      - View active router configuration\n  show ip route           - View IP routing table and gateways\n  show vlan brief         - Display VLAN membership and port states\n  show ip interface brief - Verify interface IPs and line protocols\n  clear counters          - Reset interface telemetry counters\n  write memory            - Save running config to NVRAM`;
    } else if (cmdLower.startsWith('clear')) {
      response = `[OK] Interface counters reset on ${hostname}.`;
    } else if (cmdLower.startsWith('write') || cmdLower === 'wr') {
      response = `Building configuration...\n[OK] Configuration committed to NVRAM.`;
    } else {
      response = `% Unrecognized Cisco IOS command: '${cmd}'. Type 'help' for diagnostics.`;
    }

    setHistory(prev => [
      ...prev,
      { type: 'input', text: cmd },
      { type: 'output', text: response }
    ]);
    setCommandInput('');

    if (onRunCommand) onRunCommand(cmd);

    setTimeout(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Split lines for evidence highlighting
  const renderOutputLines = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const isHighlightedEvidence = 
        (evidenceHighlight && line.toLowerCase().includes(evidenceHighlight.toLowerCase())) ||
        line.toLowerCase().includes('administratively down') ||
        line.toLowerCase().includes('down') && line.toLowerCase().includes('gigabit') ||
        line.toLowerCase().includes('err-disabled') ||
        line.toLowerCase().includes('denied') ||
        line.toLowerCase().includes('loop');

      const matchesSearch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        <div 
          key={idx}
          className={`py-0.5 px-2 font-mono text-[11px] leading-relaxed transition-colors flex items-start gap-2 ${
            isHighlightedEvidence 
              ? 'bg-rose-950/80 text-rose-200 border-l-2 border-rose-500 font-semibold my-0.5 shadow-sm' 
              : matchesSearch 
              ? 'bg-amber-950/80 text-amber-200 border-l-2 border-amber-400'
              : 'text-slate-300 hover:bg-slate-900/40'
          }`}
        >
          <span className="text-[10px] text-slate-400 select-none w-6 text-right flex-shrink-0 font-mono">
            {idx + 1}
          </span>
          <span className="break-all whitespace-pre-wrap">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className={`bg-[#050B14] rounded-2xl border border-[#162942] shadow-md overflow-hidden flex flex-col transition-all ${
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'relative'
    }`}>
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-[#07111E] border-b border-[#162942] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white tracking-wide">
            Cisco IOS Evidence Terminal
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
            {hostname}#
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Find in output..."
              className="bg-[#0B1728] border border-[#1A3150] rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 w-32 focus:w-44 transition-all"
            />
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-[#0B1728] hover:bg-[#0E1E34] text-slate-300 hover:text-white border border-[#1A3150] text-[11px] font-mono flex items-center gap-1.5 transition-colors"
            title="Copy Cisco CLI Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isExpanded ? "Exit Fullscreen" : "Fullscreen Terminal"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-3 bg-[#040810] font-mono text-xs overflow-y-auto max-h-[300px] sm:max-h-[360px] min-h-[200px] flex-1">
        {history.map((entry, idx) => {
          if (entry.type === 'system') {
            return (
              <div key={idx} className="text-slate-400 text-[10px] italic py-0.5 border-b border-slate-900 mb-1">
                [SYSTEM] {entry.text}
              </div>
            );
          }
          if (entry.type === 'input') {
            return (
              <div key={idx} className="text-cyan-300 font-bold py-1 flex items-center gap-1.5">
                <span className="text-slate-400">{hostname}#</span>
                <span>{entry.text}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="py-1">
              {renderOutputLines(entry.text)}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Prompt */}
      <form onSubmit={handleExecute} className="px-3 py-2 bg-[#07111E] border-t border-[#162942] flex items-center gap-2">
        <span className="text-cyan-400 font-mono text-xs font-bold flex-shrink-0">
          {hostname}#
        </span>
        <input
          type="text"
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          placeholder="Type Cisco command (e.g., 'show run', 'show ip route', 'help')..."
          className="flex-1 bg-transparent border-0 text-white font-mono text-xs focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!commandInput.trim()}
          className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
        >
          <span>SEND</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
