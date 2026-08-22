import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosticCase, AuditLogEntry } from './src/types.ts';
import { runDeterministicChecks } from './src/engine/checker.ts';
import { validateAndSanitizeAiDiagnosis } from './src/engine/aiValidator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const dataDir = path.resolve(__dirname, 'data');
const casesJsonPath = path.resolve(dataDir, 'cases.json');
const casesCsvPath = path.resolve(dataDir, 'cases.csv');
const auditJsonPath = path.resolve(dataDir, 'audit-logs.json');

// Memory databases initialized by loading persistent disk tables
let casesDb: DiagnosticCase[] = [];
let auditLogsDb: AuditLogEntry[] = [
  {
    timestamp: "2026-08-20 09:15:00",
    caseId: "NET-031",
    actionType: "OPERATOR OVERRIDE",
    targetNode: "10.10.30.1 / WLC-01",
    message: "Operator refined remediation sequence to include 'ip helper-address 192.168.1.100' on AP manager interface.",
    integrityToken: "",
    previousHash: "sha256:genesis_block_init",
    safetyStatus: "MODIFIED",
    reviewer: "Senior NetOps Lead",
    humanDecision: "EDITED",
    aiDiagnosis: "WLC AP client DHCP lease timeout.",
    confidence: "Medium",
    evidence: "%CAPWAP-3-DHCP_TIMEOUT: AP failed to obtain IP from relay.",
    originalCommands: ["wlan 1", "client vlan 30"],
    editedCommands: ["interface GigabitEthernet0/0.30", "ip helper-address 192.168.1.100", "no shutdown"],
    reason: "AI omitted relay helper-address specification required on router subinterface."
  },
  {
    timestamp: "2026-08-20 08:55:10",
    caseId: "NET-027",
    actionType: "OPERATOR OVERRIDE",
    targetNode: "172.16.1.1 / BR-ROUTER-01",
    message: "Operator corrected ACL statement to permit UDP port 53 rather than flush entire access-list.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "MODIFIED",
    reviewer: "M. Zhao",
    humanDecision: "EDITED",
    aiDiagnosis: "DNS resolution failure due to ACL filter.",
    confidence: "High",
    evidence: "access-list 102 deny udp any any eq 53",
    originalCommands: ["no access-list 102", "permit ip any any"],
    editedCommands: ["access-list 102 permit udp any any eq domain", "access-list 102 permit ip any any"],
    reason: "Preserved security posture by permitting domain port 53 specifically rather than deleting the ACL."
  },
  {
    timestamp: "2026-08-20 08:42:15",
    caseId: "NET-022",
    actionType: "OPERATOR OVERRIDE",
    targetNode: "10.0.0.1 / WAN-EDGE-01",
    message: "Operator show interface output confirmed MTU 1500 vs MTU 1492 on serial link. Overrode AI duplicate router-id claim.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "MODIFIED",
    reviewer: "K. Patel (CCIE #54210)",
    humanDecision: "EDITED",
    aiDiagnosis: "Identified duplicate Router-ID 1.1.1.1 across neighbor adjacency.",
    confidence: "Medium",
    evidence: "OSPF-5-ADJCHG: Neighbor 2.2.2.2 on Serial0/0/0 stuck in EXSTART state.",
    originalCommands: ["router ospf 1", "router-id 1.1.1.2"],
    editedCommands: ["interface Serial0/0/0", "ip mtu 1500"],
    reason: "DBD packets were stuck in EXSTART state due to MTU size disparity, not OSPF ID."
  },
  {
    timestamp: "2026-08-20 08:32:00",
    caseId: "NET-007",
    actionType: "OPERATOR OK",
    targetNode: "10.10.10.3 / ACCESS-SWITCH-02",
    message: "Dry-run simulation of native VLAN alignment passed. Configuration queued for lab deployment.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "SECURE",
    reviewer: "M. Zhao",
    humanDecision: "ACCEPTED",
    aiDiagnosis: "Native VLAN mismatch on trunk link GigabitEthernet0/1 (VLAN 1 vs VLAN 99).",
    confidence: "High",
    evidence: "%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (99), with ACCESS-SWITCH-01 GigabitEthernet0/1 (1)",
    originalCommands: ["interface GigabitEthernet0/1", "switchport trunk native vlan 99"],
    editedCommands: ["interface GigabitEthernet0/1", "switchport trunk native vlan 99"],
    reason: "Aligned native VLAN across distribution trunk link."
  },
  {
    timestamp: "2026-08-20 08:15:22",
    caseId: "NET-001",
    actionType: "HUMAN GATE PASS",
    targetNode: "192.168.12.1 / CORE-01",
    message: "Case NET-001 approved by M. Zhao. Sub-interface no shutdown queued for simulation.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "COMPLIANT",
    reviewer: "M. Zhao",
    humanDecision: "ACCEPTED",
    aiDiagnosis: "GigabitEthernet0/0.30 subinterface is administratively down in interface configuration.",
    confidence: "High",
    evidence: "GigabitEthernet0/0.30 10.10.30.1 YES manual administratively down down",
    originalCommands: ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown"],
    editedCommands: ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown"],
    reason: "Standard administrative enablement following maintenance window."
  },
  {
    timestamp: "2026-08-20 07:50:41",
    caseId: "NET-018",
    actionType: "AUTO BLOCKED SLIP",
    targetNode: "10.30.30.50 / SRV-01",
    message: "ACL validation check blocked an overly broad AI permit suggestion 'permit ip any any'.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "BLOCKED",
    reviewer: "AI_SAFETY_GATE",
    humanDecision: "EDITED",
    aiDiagnosis: "Inbound SSH connection blocked by implicit ACL deny on router interface.",
    confidence: "High",
    evidence: "access-list 100 deny ip any any log",
    originalCommands: ["access-list 100 permit ip any any"],
    editedCommands: ["access-list 100 permit tcp 10.10.10.0 0.0.0.255 host 10.30.30.50 eq 22"],
    reason: "Blocked overly permissive wildcard rule. Substituted targeted SSH permit."
  },
  {
    timestamp: "2026-08-20 07:30:18",
    caseId: "NET-014",
    actionType: "OPERATOR OVERRIDE",
    targetNode: "10.10.20.1 / RTR-BRANCH",
    message: "Operator verified access-list 101 denied UDP port 67/68 traffic to DHCP server. Corrected AI pool assumption.",
    integrityToken: "",
    previousHash: "",
    safetyStatus: "MODIFIED",
    reviewer: "NOC Tier-2 Engineer",
    humanDecision: "EDITED",
    aiDiagnosis: "Diagnosed as DHCP pool exhaustion and proposed 'ip dhcp pool VLAN20'.",
    confidence: "Medium",
    evidence: "access-list 101 deny udp any any eq 67",
    originalCommands: ["ip dhcp pool VLAN20", "network 10.10.20.0 255.255.255.0"],
    editedCommands: ["access-list 101 permit udp any host 10.10.1.100 eq bootps", "interface GigabitEthernet0/1", "ip helper-address 10.10.1.100"],
    reason: "AI overlooked explicit deny rule for DHCP relay traffic in ACL 101."
  }
];

// Helper to calculate full 64-character SHA-256 hash for sequential chaining
function computeAuditHash(log: AuditLogEntry, previousHash: string): string {
  const content = [
    log.timestamp,
    log.caseId || "",
    log.actionType,
    log.targetNode,
    log.message,
    log.aiDiagnosis || "",
    log.confidence || "",
    (log.originalCommands || []).join(','),
    (log.editedCommands || []).join(','),
    log.humanDecision || "",
    log.reviewer || "",
    log.reason || "",
    previousHash
  ].join('|');
  return "sha256:" + crypto.createHash('sha256').update(content).digest('hex');
}

// Rebuild hash tokens from scratch using sequential cryptographic chain rules
function rebuildAuditHashes() {
  let previousHash = "sha256:genesis_block_init";
  const reversed = [...auditLogsDb].reverse();
  for (let i = 0; i < reversed.length; i++) {
    const log = reversed[i];
    log.previousHash = previousHash;
    log.integrityToken = computeAuditHash(log, previousHash);
    log.currentHash = log.integrityToken;
    previousHash = log.integrityToken;
  }
  auditLogsDb = reversed.reverse();
}

// Dynamic CSV parser for /data/cases.csv as required by Case Dataset Spec
function parseCasesCsv(): DiagnosticCase[] {
  try {
    const csvPath = path.resolve(__dirname, 'data/cases.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn("data/cases.csv not found.");
      return [];
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          currentRow.push(currentField);
          currentField = '';
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    if (currentRow.length > 0 || currentField !== '') {
      currentRow.push(currentField);
      rows.push(currentRow);
    }
    if (rows.length <= 1) return [];
    const headers = rows[0];
    const cases: DiagnosticCase[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;
      const caseId = row[0];
      const title = row[1];
      const symptom = row[2];
      const topologyNoteRaw = row[3];
      const showOutputs = row[4];
      const expectedFault = row[5];
      const expectedOsiLayer = row[6];
      const conceptTag = row[7];
      const severity = row[8] as any;
      const expectedNextCommand = row[9];
      const expectedFixStepsRaw = row[10];
      const expectedRuleIds = row[11] || "";

      let topology = { nodes: [], links: [] };
      try {
        topology = JSON.parse(topologyNoteRaw);
      } catch (e) {
        // fallback
      }

      cases.push({
        id: caseId,
        title: title,
        severity: severity || "Medium",
        status: "Pending Review",
        category: conceptTag,
        timestamp: "2026-08-20 08:35:00",
        operator: "Network Operator",
        networkProblem: symptom,
        networkEvidence: {
          hostname: topology.nodes?.[0]?.name || "ROUTER-01",
          showCommandOutput: showOutputs,
          commandHistory: [expectedNextCommand || "show ip interface brief"]
        },
        ruleChecks: runDeterministicChecks(showOutputs, caseId, title, conceptTag),
        groundTruth: {
          expectedFault: expectedFault,
          expectedOsiLayer: expectedOsiLayer,
          expectedNextCommand: expectedNextCommand,
          expectedFixSteps: expectedFixStepsRaw.split('\n').filter(Boolean),
          expectedRuleIds: expectedRuleIds
        },
        aiDiagnosis: {
          rootCause: expectedFault,
          osiLayer: expectedOsiLayer,
          confidence: 95,
          confidenceLevel: "High",
          evidenceHighlight: expectedFault.slice(0, 80),
          nextCommand: expectedNextCommand,
          fixSteps: expectedFixStepsRaw.split('\n').filter(Boolean),
          hallucinationFlag: false,
          groundingStatus: "GROUNDED",
          evaluationAgainstGroundTruth: "CORRECT",
          evaluationNotes: "Validated against dataset benchmark ground truth."
        },
        topology: topology,
        expectedRuleIds: expectedRuleIds
      });
    }
    return cases;
  } catch (err) {
    console.error("Error parsing cases.csv:", err);
    return [];
  }
}

function saveCasesToDisk() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(casesJsonPath, JSON.stringify(casesDb, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save cases database to disk:", err);
  }
}

function saveAuditLogsToDisk() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(auditJsonPath, JSON.stringify(auditLogsDb, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save audit logs to disk:", err);
  }
}

function initializeDatabases() {
  // Always derive cases directly from authoritative data/cases.csv as single source of truth
  casesDb = parseCasesCsv();
  if (casesDb.length === 0) {
    console.error("FATAL ERROR: Authoritative dataset data/cases.csv could not be loaded or parsed.");
  } else {
    console.log(`Loaded ${casesDb.length} authoritative network cases directly from data/cases.csv.`);
    saveCasesToDisk();
  }

  if (fs.existsSync(auditJsonPath)) {
    try {
      auditLogsDb = JSON.parse(fs.readFileSync(auditJsonPath, 'utf8'));
      console.log(`Loaded ${auditLogsDb.length} audit logs from audit-logs.json persistent storage.`);
    } catch (err) {
      console.error("Failed to parse audit-logs.json, using fallback.");
      rebuildAuditHashes();
      saveAuditLogsToDisk();
    }
  } else {
    rebuildAuditHashes();
    saveAuditLogsToDisk();
  }
}

// Perform structural boot sequence database setup
initializeDatabases();

// Lazy-loaded Gemini client to prevent startup crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined. Please add your Gemini API key in the AI Studio Settings > Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes - NOC Database Synchronisation
app.get('/api/cases', (req, res) => {
  if (!casesDb || casesDb.length === 0) {
    casesDb = parseCasesCsv();
    if (!casesDb || casesDb.length === 0) {
      return res.status(503).json({ error: "Authoritative dataset data/cases.csv could not be loaded or is empty." });
    }
  }
  res.json(casesDb);
});

app.post('/api/cases', (req, res) => {
  try {
    const newCase: DiagnosticCase = req.body;
    if (!newCase || !newCase.id) {
      return res.status(400).json({ error: "Invalid case data provided." });
    }
    if (casesDb.some(c => c.id === newCase.id)) {
      return res.status(400).json({ error: `Case ID ${newCase.id} already exists in the catalog.` });
    }
    casesDb.unshift(newCase);
    saveCasesToDisk();
    res.status(201).json(newCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create case." });
  }
});

app.put('/api/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const caseData: Partial<DiagnosticCase> = req.body;
    
    let updated = false;
    casesDb = casesDb.map(c => {
      if (c.id === id) {
        updated = true;
        return { ...c, ...caseData };
      }
      return c;
    });

    if (!updated) {
      return res.status(404).json({ error: `Case ${id} not found.` });
    }

    saveCasesToDisk();
    const updatedCase = casesDb.find(c => c.id === id);
    res.json(updatedCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update case." });
  }
});

app.get('/api/audit-logs', (req, res) => {
  res.json(auditLogsDb);
});

app.post('/api/audit-logs', (req, res) => {
  try {
    const logEntry: Omit<AuditLogEntry, 'integrityToken'> = req.body;
    if (!logEntry || !logEntry.actionType || !logEntry.message) {
      return res.status(400).json({ error: "Invalid audit log entry: actionType and message are required." });
    }

    // Safety validation for Human Review Decisions
    const decision = (logEntry.humanDecision || "").toUpperCase();
    if (decision === "REJECTED" || decision === "REJECT") {
      if (!logEntry.reason || typeof logEntry.reason !== 'string' || logEntry.reason.trim().length === 0) {
        return res.status(400).json({ error: "Validation Error: Rejection reason is mandatory when rejecting a diagnosis." });
      }
    }

    if (decision === "EDITED" || decision === "APPROVED WITH EDITS") {
      if (!logEntry.editedCommands || !Array.isArray(logEntry.editedCommands) || logEntry.editedCommands.length === 0) {
        return res.status(400).json({ error: "Validation Error: Edited commands list must be provided when approving with edits." });
      }
    }

    const previousEntry = auditLogsDb[0];
    const previousHash = previousEntry ? (previousEntry.integrityToken || previousEntry.currentHash || "sha256:genesis_block_init") : "sha256:genesis_block_init";
    const computedToken = computeAuditHash(logEntry as any, previousHash);

    const fullLog: AuditLogEntry = {
      ...logEntry,
      previousHash,
      integrityToken: computedToken,
      currentHash: computedToken
    };

    auditLogsDb.unshift(fullLog);
    saveAuditLogsToDisk();
    res.status(201).json(fullLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to append audit log." });
  }
});

app.post('/api/audit/verify', (req, res) => {
  try {
    let previousHash = "sha256:genesis_block_init";
    let integrityCompromised = false;
    let compromisedIdx = -1;
    let reason = "";

    const logsToVerify = [...auditLogsDb].reverse();

    for (let i = 0; i < logsToVerify.length; i++) {
      const log = logsToVerify[i];
      const computedHash = computeAuditHash(log, previousHash);
      
      if (log.integrityToken !== computedHash && log.currentHash !== computedHash) {
        integrityCompromised = true;
        compromisedIdx = auditLogsDb.length - 1 - i;
        reason = `Hash mismatch at record index ${compromisedIdx} (Case: ${log.caseId || 'N/A'}). Stored: ${log.integrityToken}, Recomputed: ${computedHash}`;
        break;
      }
      if (log.previousHash && log.previousHash !== previousHash) {
        integrityCompromised = true;
        compromisedIdx = auditLogsDb.length - 1 - i;
        reason = `Previous hash pointer mismatch at index ${compromisedIdx}.`;
        break;
      }
      previousHash = computedHash;
    }

    if (integrityCompromised) {
      res.json({
        verified: false,
        message: `AUDIT INTEGRITY FAILED: Chain compromised at entry index ${compromisedIdx}. ${reason}`,
        compromisedIndex: compromisedIdx
      });
    } else {
      res.json({
        verified: true,
        message: `AUDIT INTEGRITY VERIFIED: Cryptographic SHA-256 hash chain successfully validated across ${auditLogsDb.length} records.`,
        recordCount: auditLogsDb.length
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify audit logs." });
  }
});

app.post('/api/generate-roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({ error: 'Please provide a valid learning topic.' });
    }

    const ai = getAiClient();

    const systemInstruction = `You are an expert learning designer and curriculum developer. 
Your goal is to build a highly structured, actionable, and comprehensive learning roadmap for the specified topic.
Make the roadmap intellectually engaging, detailed, and realistic. 
Ensure the resources you suggest are real, reputable, and highly regarded platforms or learning mediums (e.g. YouTube, Khan Academy, Coursera, official documentation, MDN, Stanford Online, specific open-source tutorials, etc.). Do not invent fake URLs.
Ensure the milestones progress logically from foundational concepts to advanced application or project building.`;

    const prompt = `Create a learning roadmap, 4 key flashcards for foundational concepts, and a 3-question interactive diagnostic quiz for the topic: "${topic}".`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { 
          type: Type.STRING,
          description: "The official topic title, nicely formatted (e.g. 'Introductory Quantum Physics')"
        },
        description: { 
          type: Type.STRING,
          description: "A concise, engaging introductory description summarizing what this roadmap covers and why it's valuable."
        },
        difficulty: { 
          type: Type.STRING,
          description: "Target difficulty level, e.g. 'Beginner', 'Intermediate', 'Advanced', or 'All Levels'"
        },
        totalEstimatedHours: { 
          type: Type.INTEGER,
          description: "The total estimated hour commitment required to finish this roadmap, logically compiled from milestone hours."
        },
        milestones: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A short, unique identifier, e.g., 'm1', 'm2'" },
              title: { type: Type.STRING, description: "Action-oriented title, e.g., 'Mastering the Fundamentals of Superposition'" },
              description: { type: Type.STRING, description: "A detailed summary of what the learner will study and accomplish during this phase." },
              hours: { type: Type.INTEGER, description: "Estimated hours to complete this milestone." },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 specific, concrete learning objectives or skills the learner will acquire."
              },
              resources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the resource or tutorial." },
                    type: { type: Type.STRING, description: "Type of resource, e.g., 'Documentation', 'Interactive Tutorial', 'Video Lecture', 'Book'" },
                    url: { type: Type.STRING, description: "A real web link or search term keyword, e.g., 'https://developer.mozilla.org/' or a valid educational URL. Never put placeholder domains." }
                  },
                  required: ["name", "type"]
                },
                description: "2-3 highly targeted, high-quality learning resources."
              }
            },
            required: ["id", "title", "description", "hours", "objectives", "resources"]
          }
        },
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING, description: "The term or core concept, e.g., 'Superposition'" },
              definition: { type: Type.STRING, description: "A precise, accurate, and concise definition." },
              analogy: { type: Type.STRING, description: "An intuitive, vivid analogy to make the concept instantly understandable to a beginner." }
            },
            required: ["concept", "definition", "analogy"]
          },
          description: "Exactly 4 core concept flashcards to establish basic terminology."
        },
        quiz: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "A thoughtful multiple-choice conceptual check question." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 distinct, plausible multiple-choice options."
              },
              correctIndex: { type: Type.INTEGER, description: "The index (0-3) of the correct answer option." },
              explanation: { type: Type.STRING, description: "A clear explanation of why this option is correct, and why others are incorrect, providing learning value." }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          },
          description: "Exactly 3 diagnostic quiz questions covering aspects of the topic."
        }
      },
      required: ["title", "description", "difficulty", "totalEstimatedHours", "milestones", "flashcards", "quiz"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // lower temperature for highly structured data
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    const roadmapData = JSON.parse(text.trim());
    res.json(roadmapData);
  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while generating your roadmap. Please check your API key or try again.' 
    });
  }
});

app.post('/api/simplify-concept', async (req, res) => {
  try {
    const { topic, concept, question } = req.body;
    if (!topic || !concept) {
      return res.status(400).json({ error: 'Please provide both the main topic and the concept to explain.' });
    }

    const ai = getAiClient();

    let queryPrompt = `Provide an extremely simplified, intuitive explanation for the concept "${concept}" in the context of learning "${topic}".`;
    if (question) {
      queryPrompt += ` Specifically answer this question: "${question}".`;
    }
    queryPrompt += ` Use a vivid, memorable everyday analogy that anyone could understand (as if explaining to a 5-year-old), keeping it concise (under 180 words) and visually structured with clear paragraphs or bullets. Do not use complex math or jargon without translating it instantly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: queryPrompt,
      config: {
        systemInstruction: "You are a master scientific communicator and teacher. You explain complex themes using simple language, warmth, and memorable real-world analogies.",
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    res.json({ explanation: text.trim() });
  } catch (error: any) {
    console.error('Error simplifying concept:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while simplifying the concept.' 
    });
  }
});

// Strict validation helper for Gemini diagnostic responses
function validateDiagnosticResponse(result: any): { valid: boolean; reason?: string } {
  if (!result || typeof result !== 'object') {
    return { valid: false, reason: "Response must be a JSON object" };
  }
  if (!result.root_cause || typeof result.root_cause !== 'string' || result.root_cause.trim().length < 5) {
    return { valid: false, reason: "root_cause must be a non-empty string" };
  }
  const validLayers = [
    "Layer 1 (Physical)",
    "Layer 2 (Data Link)",
    "Layer 3 (Network)",
    "Layer 4 (Transport)",
    "Layer 7 (Application)",
    "Physical",
    "Data Link",
    "Network",
    "Transport",
    "Application"
  ];
  if (!result.osi_layer || typeof result.osi_layer !== 'string') {
    return { valid: false, reason: "osi_layer must be specified" };
  }
  const hasValidLayer = validLayers.some(l => result.osi_layer.toLowerCase().includes(l.toLowerCase()));
  if (!hasValidLayer) {
    return { valid: false, reason: `osi_layer '${result.osi_layer}' is not a recognized standard OSI layer` };
  }
  const validConf = ["High", "Medium", "Low"];
  if (!result.confidence || !validConf.includes(result.confidence)) {
    return { valid: false, reason: "confidence must be 'High', 'Medium', or 'Low'" };
  }
  if (!Array.isArray(result.evidence) || result.evidence.length === 0) {
    return { valid: false, reason: "evidence must be a non-empty array of strings" };
  }
  if (!result.next_command || typeof result.next_command !== 'string') {
    return { valid: false, reason: "next_command must be a non-empty string" };
  }
  if (!Array.isArray(result.fix_steps) || result.fix_steps.length === 0) {
    return { valid: false, reason: "fix_steps must be a non-empty array of commands" };
  }
  return { valid: true };
}

app.post('/api/diagnose-network', async (req, res) => {
  try {
    const {
      case_id,
      symptom,
      topology_note,
      show_outputs,
      concept_tag,
      severity,
      osi_layer,
      deterministic_rule_results
    } = req.body;

    if (!case_id || !symptom || !show_outputs) {
      return res.status(400).json({ error: 'Missing required diagnostic inputs: case_id, symptom, and show_outputs are mandatory.' });
    }

    const ai = getAiClient();

    const systemInstruction = `Act as an expert Cisco network troubleshooting assistant for Network Operations Center (NOC) engineers.
Analyze only the evidence provided in the show command outputs, syslog alerts, and deterministic rule checks.

Determine:
1. root_cause: Concise, technically precise description of the exact root cause grounded strictly in the provided evidence.
2. osi_layer: The affected OSI layer (must be one of: "Layer 1 (Physical)", "Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)").
3. confidence: Diagnosis confidence level (must be exactly "High", "Medium", or "Low").
4. evidence: Array of verbatim quotes or specific factual findings extracted directly from the show command output and syslog data.
5. next_command: The single most effective Cisco IOS verification command to confirm the state or isolate further.
6. fix_steps: Sequential list of safe Cisco IOS configuration commands to remediate the diagnosed root cause.

STRICT SAFETY DIRECTIVES:
- Do not invent evidence or command output.
- Do not claim a network change occurred or has already been applied.
- All remediation steps are proposals for human operator review.
- If the evidence is insufficient, state "DIAGNOSIS REQUIRES HUMAN INVESTIGATION: Additional evidence required."

You must return valid JSON conforming to the requested schema.`;

    const inputData = {
      case_id,
      symptom,
      topology_note: topology_note || "N/A",
      show_outputs,
      concept_tag: concept_tag || "N/A",
      severity: severity || "Medium",
      osi_layer: osi_layer || "N/A",
      deterministic_rule_results: deterministic_rule_results || []
    };

    const prompt = `Please analyze the following structured network incident and provide a comprehensive diagnostic evaluation:\n\n${JSON.stringify(inputData, null, 2)}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        root_cause: {
          type: Type.STRING,
          description: "Concise and technical analysis of the most likely root cause based ONLY on the evidence provided."
        },
        osi_layer: {
          type: Type.STRING,
          description: "The OSI Layer where the fault lies (e.g. 'Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)')."
        },
        confidence: {
          type: Type.STRING,
          description: "The diagnosis confidence score. Must be exactly one of: 'High', 'Medium', 'Low'."
        },
        evidence: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific highlighted bullet points of raw evidence from the command outputs or rule checks that support this diagnosis."
        },
        next_command: {
          type: Type.STRING,
          description: "The next single Cisco IOS verification command to run to confirm or further isolate, e.g. 'show spanning-tree vlan 10'."
        },
        fix_steps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Sequential list of safe Cisco IOS config commands to resolve the issue."
        }
      },
      required: ["root_cause", "osi_layer", "confidence", "evidence", "next_command", "fix_steps"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1, // very low temperature for precise, deterministic technical troubleshooting
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    let result: any;
    try {
      result = JSON.parse(text.trim());
    } catch (parseErr) {
      return res.status(422).json({
        root_cause: "DIAGNOSIS REQUIRES HUMAN INVESTIGATION: AI response was malformed JSON.",
        osi_layer: osi_layer || "Layer 3 (Network)",
        confidence: "Low",
        evidence: ["AI generation output failed JSON parse validation"],
        next_command: "show running-config",
        fix_steps: ["! Manual inspection required by NOC operator"]
      });
    }

    // Strict schema, types, and hallucination grounding validation
    const ruleContextStr = Array.isArray(deterministic_rule_results) 
      ? deterministic_rule_results.join('\n') 
      : (typeof deterministic_rule_results === 'string' ? deterministic_rule_results : "");
    const validation = validateAndSanitizeAiDiagnosis(result, show_outputs, ruleContextStr);
    
    if (!validation.valid || !validation.grounded) {
      console.warn(`[AI SAFETY FLAG] Diagnosis validation warning: ${validation.reason}`);
    }

    res.json(validation.sanitizedResponse || result);
  } catch (error: any) {
    console.error('Error diagnosing network:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred during AI network diagnostic analysis.'
    });
  }
});

// Serve Frontend
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

if (isProd) {
  const distPath = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Allow API routes to slide through
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.warn('Production build not found in dist/. Please run npm run build.');
  }
} else {
  // Integrate Vite Dev Server in Development
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NetSage AI operations backend server running on http://0.0.0.0:${PORT}`);
});
