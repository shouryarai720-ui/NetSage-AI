import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Server, 
  Share2, 
  Monitor, 
  Laptop, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Radio,
  Sliders,
  Send,
  Layers,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Info,
  Terminal
} from 'lucide-react';
import { DeviceNode, NetworkLink } from '../../types';
import { PduDetailsModal, PduData } from './PduDetailsModal';
import { DeviceConfigModal } from './DeviceConfigModal';

interface TopologyHeroProps {
  nodes: DeviceNode[];
  links: NetworkLink[];
  caseId: string;
  targetHostname: string;
}

interface SimulationEvent {
  id: string;
  time: string;
  lastDevice: string;
  atDevice: string;
  protocol: 'ICMP' | 'ARP' | 'DHCP' | 'DNS' | 'TCP' | 'OSPF';
  info: string;
  status: 'SUCCESS' | 'DROPPED' | 'FILTERED' | 'IN_TRANSIT';
  dropReason?: string;
}

export const TopologyHero: React.FC<TopologyHeroProps> = ({
  nodes: initialNodes,
  links: initialLinks,
  caseId,
  targetHostname
}) => {
  // State for interactive nodes & links (allows fault simulation)
  const [links, setLinks] = useState<NetworkLink[]>(initialLinks);
  const [nodes, setNodes] = useState<DeviceNode[]>(initialNodes);

  // Sync when case changes
  useEffect(() => {
    setLinks(initialLinks);
    setNodes(initialNodes);
    if (initialNodes && initialNodes.length > 0) {
      setPingSource(initialNodes[0]?.id || '');
      setPingTarget(initialNodes[initialNodes.length - 1]?.id || '');
    }
    setPingLogs([]);
    setActivePdu(null);
    setSimEvents([]);
  }, [initialNodes, initialLinks, caseId]);

  // Point & Click Simple PDU Mode (Packet Tracer Envelope tool)
  const [pointAndClickPing, setPointAndClickPing] = useState(false);
  const [pointAndClickStep, setPointAndClickStep] = useState<'source' | 'target'>('source');

  // View & Canvas State
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showPortLabels, setShowPortLabels] = useState(true);
  const [showVlanZones, setShowVlanZones] = useState(true);
  const [showPacketFlows, setShowPacketFlows] = useState(true);

  // Mode: Realtime vs Simulation
  const [mode, setMode] = useState<'realtime' | 'simulation'>('realtime');
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simStep, setSimStep] = useState<number>(0);

  // Modals & Inspection State
  const [selectedNode, setSelectedNode] = useState<DeviceNode | null>(null);
  const [activePdu, setActivePdu] = useState<PduData | null>(null);

  // Interactive Ping / PDU Tool State
  const [pingSource, setPingSource] = useState<string>(initialNodes[0]?.id || '');
  const [pingTarget, setPingTarget] = useState<string>(initialNodes[initialNodes.length - 1]?.id || '');
  const [isPinging, setIsPinging] = useState(false);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [activePingPacket, setActivePingPacket] = useState<{
    source: string;
    target: string;
    currentX: number;
    currentY: number;
    progress: number;
    status: 'moving' | 'dropped' | 'success';
    dropReason?: string;
  } | null>(null);

  // Simulation Event Log
  const [simEvents, setSimEvents] = useState<SimulationEvent[]>([]);

  // SVG Base Dimensions
  const width = 840;
  const height = 360;

  // Node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, DeviceNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Find shortest path between source and target using BFS
  const findPath = (srcId: string, dstId: string): string[] => {
    if (srcId === dstId) return [srcId];
    const queue: string[][] = [[srcId]];
    const visited = new Set<string>([srcId]);

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const curr = currentPath[currentPath.length - 1];

      if (curr === dstId) return currentPath;

      // Find neighbors
      const neighbors: string[] = [];
      links.forEach(l => {
        if (l.source === curr && !visited.has(l.target)) {
          neighbors.push(l.target);
        } else if (l.target === curr && !visited.has(l.source)) {
          neighbors.push(l.source);
        }
      });

      for (const n of neighbors) {
        visited.add(n);
        queue.push([...currentPath, n]);
      }
    }
    return [];
  };

  // Execute Interactive ICMP Ping Simulation
  const handleSendPing = (overrideSrcId?: string, overrideDstId?: string) => {
    const srcId = overrideSrcId || pingSource;
    const dstId = overrideDstId || pingTarget;

    if (!srcId || !dstId) return;
    if (srcId === dstId) {
      setPingLogs([`% Ping Error: Source and Target device (${srcId}) cannot be identical.`]);
      return;
    }

    const srcNode = nodeMap.get(srcId);
    const tgtNode = nodeMap.get(dstId);
    if (!srcNode || !tgtNode) return;

    if (overrideSrcId) setPingSource(overrideSrcId);
    if (overrideDstId) setPingTarget(overrideDstId);

    setIsPinging(true);
    const path = findPath(srcId, dstId);

    setPingLogs([
      `Packet Tracer ICMP Probe: Starting echo sequence...`,
      `Pinging ${tgtNode.name} (${tgtNode.ip}) from ${srcNode.name} (${srcNode.ip}) with 32 bytes of data:`
    ]);

    // Check if any link in the path is failed
    let failedHopIndex = -1;
    let failedReason = '';

    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const link = links.find(l => (l.source === u && l.target === v) || (l.source === v && l.target === u));
      const uNode = nodeMap.get(u);
      const vNode = nodeMap.get(v);

      if (link && link.status === 'failed') {
        failedHopIndex = i + 1;
        failedReason = `Physical link outage between ${uNode?.name} and ${vNode?.name}`;
        break;
      }
      if (vNode && vNode.status === 'failed') {
        failedHopIndex = i + 1;
        failedReason = `Device ${vNode.name} (${vNode.ip}) is offline or interface blocked`;
        break;
      }
    }

    // Animate the ping packet
    let progress = 0;
    setActivePingPacket({
      source: srcId,
      target: dstId,
      currentX: srcNode.x,
      currentY: srcNode.y,
      progress: 0,
      status: 'moving'
    });

    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        clearInterval(interval);
        if (failedHopIndex !== -1 || path.length === 0) {
          const dropNodeName = path[failedHopIndex] ? nodeMap.get(path[failedHopIndex])?.name : 'Gateway';
          setActivePingPacket(prev => prev ? { 
            ...prev, 
            status: 'dropped', 
            dropReason: failedReason || 'No routing path to destination' 
          } : null);

          setPingLogs(prev => [
            ...prev,
            `Request timed out (Dropped at ${dropNodeName}: ${failedReason || 'Destination host unreachable'}).`,
            `Request timed out.`,
            `Request timed out.`,
            `Ping statistics for ${tgtNode.ip}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
          ]);

          // Add to simulation events
          const newEvent: SimulationEvent = {
            id: String(Date.now()).slice(-4),
            time: '0.0' + Math.floor(Math.random() * 90 + 10) + 's',
            lastDevice: srcNode.name,
            atDevice: dropNodeName || 'Network',
            protocol: 'ICMP',
            info: `ICMP Echo Request (Dropped: ${failedReason || 'ACL / Link Outage'})`,
            status: 'DROPPED',
            dropReason: failedReason || 'No route / Link down'
          };
          setSimEvents(prev => [newEvent, ...prev]);

        } else {
          setActivePingPacket(prev => prev ? { ...prev, status: 'success' } : null);
          setPingLogs(prev => [
            ...prev,
            `Reply from ${tgtNode.ip}: bytes=32 time=2ms TTL=128`,
            `Reply from ${tgtNode.ip}: bytes=32 time=1ms TTL=128`,
            `Reply from ${tgtNode.ip}: bytes=32 time=2ms TTL=128`,
            `Reply from ${tgtNode.ip}: bytes=32 time=1ms TTL=128`,
            `Ping statistics for ${tgtNode.ip}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss), Approximate round trip: 1.5ms`
          ]);

          // Add to simulation events
          const newEvent: SimulationEvent = {
            id: String(Date.now()).slice(-4),
            time: '0.0' + Math.floor(Math.random() * 90 + 10) + 's',
            lastDevice: srcNode.name,
            atDevice: tgtNode.name,
            protocol: 'ICMP',
            info: `ICMP Echo Reply (Type 0, Code 0) - Success (RTT 1.5ms)`,
            status: 'SUCCESS'
          };
          setSimEvents(prev => [newEvent, ...prev]);
        }
        setIsPinging(false);
      } else {
        // Interpolate along path
        if (path.length > 1) {
          const totalSegments = path.length - 1;
          const currentSegmentIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
          const segmentProgress = (progress * totalSegments) - currentSegmentIndex;

          const n1 = nodeMap.get(path[currentSegmentIndex]);
          const n2 = nodeMap.get(path[currentSegmentIndex + 1]);
          if (n1 && n2) {
            setActivePingPacket(prev => prev ? {
              ...prev,
              currentX: n1.x + (n2.x - n1.x) * segmentProgress,
              currentY: n1.y + (n2.y - n1.y) * segmentProgress,
              progress
            } : null);
          }
        }
      }
    }, 40 / simSpeed);
  };

  // Toggle link failure status directly on click
  const handleToggleLink = (srcId: string, tgtId: string) => {
    setLinks(prev => prev.map(l => {
      if ((l.source === srcId && l.target === tgtId) || (l.source === tgtId && l.target === srcId)) {
        const nextStatus = l.status === 'failed' ? 'active' : 'failed';
        return { ...l, status: nextStatus };
      }
      return l;
    }));
  };

  // Open detailed PDU modal for an event or active packet
  const handleInspectPdu = (event: SimulationEvent) => {
    const srcNode = nodes.find(n => n.name === event.lastDevice) || nodes[0];
    const tgtNode = nodes.find(n => n.name === event.atDevice) || nodes[nodes.length - 1];

    const pdu: PduData = {
      id: event.id,
      protocol: event.protocol,
      sourceDevice: event.lastDevice,
      targetDevice: event.atDevice,
      currentDevice: event.atDevice,
      status: event.status,
      dropReason: event.dropReason,
      osiLayers: {
        layer1: { port: 'GigabitEthernet0/1', media: '1000Base-T Copper', bandwidth: '1 Gbps' },
        layer2: { 
          srcMac: '0001.42A3.8B01', 
          dstMac: event.status === 'SUCCESS' ? '0050.7966.6800' : 'FFFF.FFFF.FFFF', 
          vlanId: srcNode?.vlan ? srcNode.vlan.replace(/\D/g, '') : '1',
          etherType: '0x0800 (IPv4)' 
        },
        layer3: { 
          srcIp: srcNode?.ip || '192.168.10.15', 
          dstIp: tgtNode?.ip || '192.168.20.100', 
          ttl: 128, 
          protocolNum: event.protocol === 'ICMP' ? 1 : event.protocol === 'TCP' ? 6 : 17 
        },
        layer4: { 
          srcPort: event.protocol === 'ICMP' ? undefined : 49152, 
          dstPort: event.protocol === 'DHCP' ? 67 : event.protocol === 'DNS' ? 53 : event.protocol === 'TCP' ? 80 : undefined,
          flags: event.protocol === 'ICMP' ? 'Echo Request (Type 8, Code 0)' : 'SYN'
        },
        layer7: { 
          type: event.protocol, 
          info: event.info, 
          payloadSummary: `Packet Tracer PDU Payload Data: Sequence #241, Checksum 0x4f2a compliant.` 
        }
      },
      inboundPduDetails: [
        `1. The frame is received on interface GigabitEthernet0/1.`,
        `2. The destination MAC address matches the device hardware address.`,
        `3. The IP header destination matches local routing table entry for destination network.`,
        event.status === 'DROPPED' 
          ? `4. DROPPED: ${event.dropReason || 'Access-list denied packet or interface protocol down'}`
          : `4. Outgoing interface GigabitEthernet0/0 selected for next-hop forwarding.`
      ],
      outboundPduDetails: event.status === 'SUCCESS' ? [
        `1. The next-hop IP is resolved via ARP cache.`,
        `2. The packet is encapsulated into an Ethernet II frame with source MAC and forwarded out Gi0/0.`
      ] : undefined
    };

    setActivePdu(pdu);
  };

  // Derive VLAN Clusters for visual background zones
  const vlanClusters = useMemo(() => {
    const clusters: Record<string, DeviceNode[]> = {};
    nodes.forEach(n => {
      const vlanKey = n.vlan || 'VLAN 1 (Default)';
      if (!clusters[vlanKey]) clusters[vlanKey] = [];
      clusters[vlanKey].push(n);
    });
    return clusters;
  }, [nodes]);

  // Handle device node interaction
  const handleNodeClick = (node: DeviceNode) => {
    if (pointAndClickPing) {
      if (pointAndClickStep === 'source') {
        setPingSource(node.id);
        setPointAndClickStep('target');
        setPingLogs([
          `✉️ Simple PDU: Selected ${node.name} (${node.ip}) as Source device.`,
          `➔ Next step: Click destination device on the canvas to execute ping.`
        ]);
      } else {
        setPingTarget(node.id);
        setPointAndClickPing(false);
        setPointAndClickStep('source');
        handleSendPing(pingSource, node.id);
      }
    } else {
      setSelectedNode(node);
    }
  };

  return (
    <div className={`bg-[#0B1728] rounded-2xl border border-[#162942] shadow-md overflow-hidden flex flex-col transition-all ${
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-[#070F1C]' : 'relative'
    }`}>
      {/* 1. Packet Tracer Visualizer Header */}
      <div className="px-4 py-3 bg-[#07111E] text-slate-200 flex flex-wrap items-center justify-between gap-3 border-b border-[#162942]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0B1728] border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Network Topology & Packet Tracer Visualizer
              </h3>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full font-mono border border-cyan-500/30">
                Cisco Lab Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Case {caseId} • Target Host: <strong className="text-cyan-400">{targetHostname}</strong>
            </p>
          </div>
        </div>

        {/* Mode Switcher: Realtime vs Simulation */}
        <div className="flex items-center gap-2">
          <div className="bg-[#07111E] p-0.5 rounded-xl border border-[#162942] flex items-center text-xs font-mono">
            <button
              onClick={() => setMode('realtime')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                mode === 'realtime'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Realtime Mode
            </button>
            <button
              onClick={() => setMode('simulation')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                mode === 'simulation'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulation Mode
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title={isExpanded ? "Minimize canvas" : "Fullscreen topology canvas"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Top Controls Toolbar: Zoom, View Layers, and Simulation Controls */}
      <div className="px-4 py-2 bg-[#081322] border-b border-[#162942] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: View Toggles & Zoom */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#07111E] px-2 py-1 rounded-lg border border-[#162942]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-300 px-1 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[10px] text-cyan-400 hover:underline px-1 border-l border-slate-700 ml-1"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => setShowPortLabels(!showPortLabels)}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
              showPortLabels 
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300' 
                : 'bg-[#07111E] border-[#162942] text-slate-400 hover:text-slate-200'
            }`}
          >
            {showPortLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Port Labels</span>
          </button>

          <button
            onClick={() => setShowVlanZones(!showVlanZones)}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
              showVlanZones 
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300' 
                : 'bg-[#07111E] border-[#162942] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>VLAN Zones</span>
          </button>
        </div>

        {/* Right: Simulation Stepper & Play/Pause (when in Simulation Mode) */}
        {mode === 'simulation' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">Simulation Controls:</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 text-xs transition-colors ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'AUTO CAPTURE'}</span>
            </button>

            <button
              onClick={() => {
                setSimStep(prev => prev + 1);
                handleSendPing();
              }}
              className="px-2.5 py-1 bg-[#07111E] hover:bg-slate-800 text-slate-200 rounded-lg border border-[#162942] flex items-center gap-1 text-xs"
              title="Capture / Forward One Step"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step Forward</span>
            </button>

            <select
              value={simSpeed}
              onChange={e => setSimSpeed(Number(e.target.value))}
              className="bg-[#07111E] border border-[#162942] text-slate-200 px-2 py-1 rounded-lg text-xs"
            >
              <option value="0.5">0.5x Speed</option>
              <option value="1">1x Speed</option>
              <option value="2">2x Speed</option>
            </select>
          </div>
        )}
      </div>

      {/* 2.5 ALWAYS-VISIBLE DEDICATED PACKET TRACER PING & SIMPLE PDU BAR */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#07172B] via-[#091C35] to-[#07172B] border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Ping Controls with Dropdowns & Point & Click Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/50 px-2.5 py-1 rounded-lg text-cyan-300 font-bold">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ICMP PING PROBE</span>
          </div>

          {/* Point & Click Tool (Envelope Icon) */}
          <button
            onClick={() => {
              setPointAndClickPing(!pointAndClickPing);
              setPointAndClickStep('source');
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 text-xs ${
              pointAndClickPing
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-[#07111E] text-slate-300 border-[#1A3150] hover:text-white hover:border-cyan-500/50'
            }`}
            title="Click two devices on the canvas to ping between them"
          >
            <span>✉️</span>
            <span>{pointAndClickPing ? (pointAndClickStep === 'source' ? 'Click Source Device...' : 'Click Target Device...') : 'Add Simple PDU (Point & Click)'}</span>
          </button>

          {/* Source Device Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Source:</span>
            <select
              value={pingSource}
              onChange={e => setPingSource(e.target.value)}
              className="bg-[#050C17] border border-[#1A3150] focus:border-cyan-400 text-cyan-300 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
            >
              {nodes.map(n => (
                <option key={`src-${n.id}`} value={n.id}>
                  {n.name} ({n.ip})
                </option>
              ))}
            </select>
          </div>

          <span className="text-cyan-400 font-bold">➔</span>

          {/* Destination Device Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Target:</span>
            <select
              value={pingTarget}
              onChange={e => setPingTarget(e.target.value)}
              className="bg-[#050C17] border border-[#1A3150] focus:border-cyan-400 text-cyan-300 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
            >
              {nodes.map(n => (
                <option key={`dst-${n.id}`} value={n.id}>
                  {n.name} ({n.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Primary SEND PING Action Button */}
          <button
            onClick={() => handleSendPing()}
            disabled={isPinging}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 fill-current ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'SENDING PACKET...' : 'SEND PING'}</span>
          </button>
        </div>

        {/* Right: Instant 1-Click Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Presets:</span>
          {nodes.length >= 2 && (
            <>
              <button
                onClick={() => handleSendPing(nodes[0].id, nodes[nodes.length - 1].id)}
                disabled={isPinging}
                className="px-2 py-0.5 bg-[#07111E] hover:bg-cyan-950 border border-[#1A3150] hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-300 rounded transition-colors"
                title={`Ping from ${nodes[0].name} to ${nodes[nodes.length - 1].name}`}
              >
                ⚡ {nodes[0].name} → {nodes[nodes.length - 1].name}
              </button>
              {nodes.length >= 3 && (
                <button
                  onClick={() => handleSendPing(nodes[0].id, nodes[1].id)}
                  disabled={isPinging}
                  className="px-2 py-0.5 bg-[#07111E] hover:bg-cyan-950 border border-[#1A3150] hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-300 rounded transition-colors"
                  title={`Ping from ${nodes[0].name} to ${nodes[1].name}`}
                >
                  ⚡ {nodes[0].name} → {nodes[1].name}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. Main Topology Canvas Container */}
      <div className="relative bg-[#050C17] flex-1 overflow-hidden min-h-[340px] flex items-center justify-center">
        {/* Point & Click Interactive Mode Visual Banner */}
        {pointAndClickPing && (
          <div className="absolute top-3 z-30 bg-amber-500/90 text-slate-950 px-4 py-1.5 rounded-full font-mono text-xs font-bold shadow-xl border border-amber-300 flex items-center gap-2 animate-bounce">
            <span>✉️</span>
            <span>
              {pointAndClickStep === 'source'
                ? 'STEP 1: Click the SOURCE device on topology'
                : 'STEP 2: Click the TARGET device to send ping'}
            </span>
            <button
              onClick={() => {
                setPointAndClickPing(false);
                setPointAndClickStep('source');
              }}
              className="ml-2 bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] hover:bg-slate-900"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* SVG Drawing Canvas with Zoom transform */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-150"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Glow Filters */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="roseGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* A. VLAN Background Zones */}
            {showVlanZones && Object.entries(vlanClusters).map(([vlanName, nodesInCluster], idx) => {
              const clusterNodes = nodesInCluster as DeviceNode[];
              if (!clusterNodes || clusterNodes.length < 1) return null;
              const xs = clusterNodes.map(n => n.x);
              const ys = clusterNodes.map(n => n.y);
              const minX = Math.min(...xs) - 45;
              const maxX = Math.max(...xs) + 45;
              const minY = Math.min(...ys) - 45;
              const maxY = Math.max(...ys) + 55;

              const colors = [
                'rgba(2, 132, 199, 0.08)',
                'rgba(16, 185, 129, 0.08)',
                'rgba(139, 92, 246, 0.08)',
                'rgba(245, 158, 11, 0.08)'
              ];
              const borderColors = [
                'rgba(2, 132, 199, 0.25)',
                'rgba(16, 185, 129, 0.25)',
                'rgba(139, 92, 246, 0.25)',
                'rgba(245, 158, 11, 0.25)'
              ];

              const color = colors[idx % colors.length];
              const borderCol = borderColors[idx % borderColors.length];

              return (
                <g key={`vlan-zone-${idx}`}>
                  <rect
                    x={minX}
                    y={minY}
                    width={maxX - minX}
                    height={maxY - minY}
                    rx="16"
                    fill={color}
                    stroke={borderCol}
                    strokeDasharray="6,4"
                    strokeWidth="1.2"
                  />
                  <text
                    x={minX + 12}
                    y={minY + 16}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {vlanName}
                  </text>
                </g>
              );
            })}

            {/* B. Network Links & Interface Ports */}
            <g className="network-links">
              {links.map((link, idx) => {
                const src = nodeMap.get(link.source);
                const tgt = nodeMap.get(link.target);
                if (!src || !tgt) return null;

                const isFailed = link.status === 'failed';
                const isWarning = link.status === 'congested';

                const strokeColor = isFailed ? '#f43f5e' : isWarning ? '#f59e0b' : '#0284c7';
                const strokeDash = isFailed ? '6,6' : 'none';

                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                // Port label offsets
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const normX = dx / dist;
                const normY = dy / dist;

                const srcPortX = src.x + normX * 36;
                const srcPortY = src.y + normY * 36;
                const tgtPortX = tgt.x - normX * 36;
                const tgtPortY = tgt.y - normY * 36;

                return (
                  <g 
                    key={`link-${idx}`} 
                    className="cursor-pointer group"
                    onClick={() => handleToggleLink(link.source, link.target)}
                  >
                    {/* Wide transparent line for easy click */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="transparent"
                      strokeWidth={14}
                    />

                    {/* Main Link Line */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={isFailed ? 3 : 2}
                      strokeDasharray={strokeDash}
                      strokeOpacity={0.85}
                      className="transition-colors group-hover:stroke-cyan-400"
                    />

                    {/* Interface Link Status Dots (Green/Amber/Red LEDs) */}
                    <circle
                      cx={srcPortX}
                      cy={srcPortY}
                      r="3.5"
                      fill={isFailed ? '#f43f5e' : '#10b981'}
                      stroke="#070F1C"
                      strokeWidth="1"
                    />
                    <circle
                      cx={tgtPortX}
                      cy={tgtPortY}
                      r="3.5"
                      fill={isFailed ? '#f43f5e' : '#10b981'}
                      stroke="#070F1C"
                      strokeWidth="1"
                    />

                    {/* Realtime Packet Animation (Continuous Flow) */}
                    {showPacketFlows && !isFailed && mode === 'realtime' && (
                      <circle r="3.5" fill="#22d3ee" filter="url(#cyanGlow)">
                        <animateMotion
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                          dur={`${4 / simSpeed}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Port Labels */}
                    {showPortLabels && (
                      <>
                        <text
                          x={srcPortX + (normY * 10)}
                          y={srcPortY - (normX * 10)}
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          Gi0/0
                        </text>
                        <text
                          x={tgtPortX + (normY * 10)}
                          y={tgtPortY - (normX * 10)}
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          Fa0/1
                        </text>
                      </>
                    )}

                    {/* Failed Outage Badge on Link */}
                    {isFailed && (
                      <g transform={`translate(${midX - 12}, ${midY - 12})`}>
                        <rect width="24" height="24" rx="6" fill="#f43f5e" filter="url(#roseGlow)" />
                        <text x="12" y="16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          ✕
                        </text>
                      </g>
                    )}

                    {/* Bandwidth & Link Speed */}
                    {link.bandwidth && !isFailed && (
                      <text
                        x={midX}
                        y={midY - 8}
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {link.bandwidth}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* C. Active Ping Packet Travel Visualization */}
            {activePingPacket && (
              <g transform={`translate(${activePingPacket.currentX}, ${activePingPacket.currentY})`}>
                {activePingPacket.status === 'dropped' ? (
                  <g filter="url(#roseGlow)">
                    <circle r="14" fill="#f43f5e" opacity="0.9" />
                    <text y="4" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">💥</text>
                  </g>
                ) : activePingPacket.status === 'success' ? (
                  <g filter="url(#cyanGlow)">
                    <circle r="12" fill="#10b981" />
                    <text y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">✓</text>
                  </g>
                ) : (
                  <g filter="url(#cyanGlow)">
                    <circle r="9" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
                    <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#0b1728" />
                    <text y="2" fill="#22d3ee" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      ICMP
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* D. Device Nodes */}
            <g className="network-nodes">
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isTargetHost = node.name.toLowerCase() === targetHostname.toLowerCase();

                const statusColor = 
                  node.status === 'failed' ? '#f43f5e' :
                  node.status === 'warning' ? '#f59e0b' : '#10b981';

                const nodeBg = 
                  node.status === 'failed' ? '#350b16' :
                  node.status === 'warning' ? '#331b05' : '#0b1626';

                const isPingSource = pingSource === node.id;
                const isPingTarget = pingTarget === node.id;

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => handleNodeClick(node)}
                    className="cursor-pointer group"
                  >
                    {/* Point & Click Indicator Halo */}
                    {pointAndClickPing && (
                      <circle
                        r="34"
                        fill="none"
                        stroke={pointAndClickStep === 'source' ? '#f59e0b' : '#38bdf8'}
                        strokeWidth="2"
                        strokeDasharray="3,3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Ping Source Badge Indicator */}
                    {isPingSource && !isSelected && (
                      <circle
                        r="27"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.8"
                      />
                    )}

                    {/* Rotating Halo Ring for Target Host or Failed Node */}
                    {(isTargetHost || node.status === 'failed') && (
                      <circle
                        r="32"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        opacity="0.85"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="12s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Active Selected Ring */}
                    {isSelected && (
                      <circle
                        r="28"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                        filter="url(#cyanGlow)"
                      />
                    )}

                    {/* Cisco Device Outer Shell */}
                    <rect
                      x="-22"
                      y="-22"
                      width="44"
                      height="44"
                      rx="12"
                      fill={nodeBg}
                      stroke={isSelected ? '#22d3ee' : statusColor}
                      strokeWidth={isSelected ? 2 : 1.5}
                      className="transition-transform group-hover:scale-105"
                    />

                    {/* Cisco Vector Iconography */}
                    <g className="pointer-events-none">
                      {node.type === 'Router' ? (
                        <g transform="translate(-10, -10)" stroke="#22d3ee" strokeWidth="1.5" fill="none">
                          <circle cx="10" cy="10" r="8" />
                          <path d="M6 10h8M10 6v8M8 8l4 4M8 12l4-4" />
                        </g>
                      ) : node.type === 'Switch' ? (
                        <g transform="translate(-10, -10)" stroke="#38bdf8" strokeWidth="1.5" fill="none">
                          <rect x="2" y="4" width="16" height="12" rx="2" />
                          <path d="M5 8h4M11 12h4M7 6l2 2-2 2M13 10l2 2-2 2" />
                        </g>
                      ) : node.type === 'Server' ? (
                        <g transform="translate(-10, -10)" stroke="#34d399" strokeWidth="1.5" fill="none">
                          <rect x="3" y="3" width="14" height="14" rx="2" />
                          <line x1="6" y1="7" x2="14" y2="7" />
                          <line x1="6" y1="11" x2="14" y2="11" />
                          <circle cx="13" cy="14" r="1" fill="#34d399" />
                        </g>
                      ) : (
                        <g transform="translate(-10, -10)" stroke="#818cf8" strokeWidth="1.5" fill="none">
                          <rect x="3" y="3" width="14" height="10" rx="1" />
                          <line x1="7" y1="16" x2="13" y2="16" />
                          <line x1="10" y1="13" x2="10" y2="16" />
                        </g>
                      )}
                    </g>

                    {/* Status Indicator LED */}
                    <circle
                      cx="15"
                      cy="-15"
                      r="4"
                      fill={statusColor}
                      stroke="#070f1c"
                      strokeWidth="1.5"
                    />

                    {/* Node Labels */}
                    <text
                      y="34"
                      fill="#f8fafc"
                      fontSize="10.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.name}
                    </text>

                    <text
                      y="46"
                      fill="#94a3b8"
                      fontSize="8.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.ip}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* E. Interactive Ping Live Output Banner */}
        {pingLogs.length > 0 && (
          <div className="absolute top-3 left-3 w-80 bg-[#07111E]/95 border border-[#1A3150] rounded-xl shadow-2xl p-3 backdrop-blur-md font-mono text-[11px] space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>ICMP Probe Console</span>
              </span>
              <button
                onClick={() => setPingLogs([])}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 text-slate-300">
              {pingLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`leading-tight ${
                    log.includes('100% loss') || log.includes('timed out') ? 'text-rose-300' :
                    log.includes('0% loss') || log.includes('Reply from') ? 'text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F. Simulation Event List Sniffer (When in Simulation Mode) */}
        {mode === 'simulation' && simEvents.length > 0 && (
          <div className="absolute bottom-3 right-3 w-96 bg-[#07111E]/95 border border-[#1A3150] rounded-xl shadow-2xl p-3 backdrop-blur-md font-mono text-xs space-y-2 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-white text-[11px] uppercase">Simulation Event Sniffer</span>
              </div>
              <span className="text-[10px] text-slate-400">Click row for PDU</span>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1">
              {simEvents.map(evt => (
                <div
                  key={evt.id}
                  onClick={() => handleInspectPdu(evt)}
                  className="p-1.5 rounded-lg bg-[#040810] hover:bg-cyan-950/40 border border-[#162942] flex items-center justify-between text-[10.5px] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                      evt.status === 'DROPPED' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {evt.protocol}
                    </span>
                    <span className="text-slate-300">{evt.lastDevice} → {evt.atDevice}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${
                    evt.status === 'DROPPED' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* G. Legend & Status Footer */}
        <div className="absolute bottom-3 left-3 bg-[#07111E]/90 border border-[#162942] rounded-lg px-3 py-1.5 text-[10px] text-slate-300 font-mono flex items-center gap-3 backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active Link (Click link to toggle fault)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Simulated Outage</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2 text-cyan-400">
            <span>Click node to open Cisco IOS Console</span>
          </div>
        </div>
      </div>

      {/* 4. Device Inspection Modal (Cisco Physical Ports, CLI Console & Routing Table) */}
      {selectedNode && (
        <DeviceConfigModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onRunPing={(src, tgt) => {
            setPingSource(src);
            setPingTarget(tgt);
            handleSendPing();
          }}
        />
      )}

      {/* 5. OSI 7-Layer PDU Inspector Modal */}
      {activePdu && (
        <PduDetailsModal
          pdu={activePdu}
          onClose={() => setActivePdu(null)}
        />
      )}
    </div>
  );
};
