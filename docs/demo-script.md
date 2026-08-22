# NetSage AI — 5–10 Minute Interactive Demonstration Script

**Document Version:** 1.0.0  
**Target Audience:** Evaluators, NOC Engineers, Network Instructors, System Auditors  
**System Under Demo:** NetSage AI — AI-Powered Network Diagnostic and Troubleshooting System  
**Estimated Time:** 5 to 10 Minutes  

---

## 1. Executive Demonstration Overview

This demonstration script provides an end-to-end walkthrough of NetSage AI. It illustrates the primary operator workflows across deterministic pattern matching, grounded Gemini AI reasoning, the human-in-the-loop (HITL) approval gate, tamper-evident SHA-256 audit logging, and automated multi-suite compliance verification.

### Key Capabilities Demonstrated:
1. **Authoritative Dataset & Case Selection:** Loading 35 Cisco IOS & Packet Tracer scenarios across 8 networking domains.
2. **Deterministic Pattern-Matching Engine:** Instant evaluation of rules `RC-01` through `RC-15` without external API calls or case-ID dependencies.
3. **Grounded AI Diagnostic Analysis:** Google Gemini 3.7 Flash diagnostic synthesis with strict regex evidence grounding and ground-truth isolation.
4. **AI Hallucination & Safety Gate:** Real-time detection and blocking of ungrounded IPs, VLANs, and phantom interfaces.
5. **Human-in-the-Loop Review Gate:** Transitioning proposals through `ACCEPTED`, `EDITED` (preserving both original and modified CLI commands), and `REJECTED` (enforcing mandatory justification).
6. **Immutable Cryptographic Audit Ledger:** Live SHA-256 hash chaining and automated tamper-detection proof across 10 security attack scenarios.
7. **One-Command Master Verification:** Executing `npm run verify` to demonstrate 100% passing compliance across TypeScript, Python, and E2E suites.

---

## 2. Prerequisites & Environment Setup

### 2.1 Starting the Application

Ensure dependencies are installed and start the unified development server:

```bash
# Start NetSage AI Full-Stack Application (Vite Frontend + Express Backend on port 3000)
npm run dev
```

Open a modern web browser and navigate to:
```
http://localhost:3000
```

### 2.2 CLI & Terminal Prerequisites

Ensure Python 3.10+ and Node.js 18+ are available in your terminal path for CLI verification checks:

```bash
node -v
npm -v
python3 --version
```

---

## 3. Demonstration Step-by-Step Flow

```
+---------------------------------------------------------------------------------------+
|                               NETSAGE AI DEMO TIMELINE                                |
+---------------------------------------------------------------------------------------+
|  [0:00 - 1:30]  Phase 1: App Overview & Case NET-001 (Subinterface Administratively Down)
|  [1:30 - 3:00]  Phase 2: Complex Scenario NET-007 (Native VLAN Mismatch on 802.1Q Trunk)|
|  [3:00 - 4:30]  Phase 3: AI Safety, Hallucination Prevention & Evidence Grounding       |
|  [4:30 - 6:30]  Phase 4: Human-in-the-Loop Review Gate (ACCEPTED, EDITED, REJECTED)    |
|  [6:30 - 8:00]  Phase 5: SHA-256 Cryptographic Audit Ledger & Tamper Detection Proof    |
|  [8:00 - 10:00] Phase 6: One-Command Authoritative Master Verification (npm run verify) |
+---------------------------------------------------------------------------------------+
```

---

### Phase 1: Case NET-001 Diagnostic Workflow (Time: 0:00 – 1:30)

**Scenario:** An employee in VLAN 30 cannot reach the default gateway. Interface `GigabitEthernet0/0.30` was left administratively disabled after maintenance.

1. **Navigate to the Diagnostics Console:**
   - In the top navigation bar, click on **"Diagnostics"** (or select **"NET-001"** from the Case Selector on the Overview Dashboard).
2. **Inspect the Loaded Evidence:**
   - Observe the pre-loaded Cisco show output in the **Cisco CLI & Evidence Inspector**:
     ```text
     R1# show ip interface brief
     GigabitEthernet0/0.30      10.10.30.1      YES manual administratively down down
     ```
   - Note that the UI displays the topology diagram highlighting `R1-CORE`, `SW-CORE-01`, and `PC-VLAN30`.
3. **Execute Deterministic Rule Check:**
   - Click the **"Run Deterministic Rules"** button.
   - **Expected Outcome:** Rule **`RC-01` (Interface Administratively Shutdown)** triggers immediately with a high-severity alert (`Status: FAIL`).
   - Notice that the rule evaluation took < 2ms and executed entirely on client/server pattern matching without invoking the LLM.
4. **Execute Grounded AI Diagnosis:**
   - Click the **"Run AI Diagnosis"** button.
   - The server proxies the request to Gemini 3.7 Flash with ground-truth isolation (the model is not given `expected_fault`).
   - **Expected Outcome:**
     - **Root Cause:** Identifies that sub-interface `GigabitEthernet0/0.30` is administratively down (`shutdown` state).
     - **OSI Layer:** `Layer 3 (Network)`.
     - **Confidence:** `High`.
     - **Evidence Citation:** `"GigabitEthernet0/0.30 is administratively down down"`.
     - **Remediation Plan:**
       ```cisco
       configure terminal
       interface GigabitEthernet0/0.30
       no shutdown
       ```

---

### Phase 2: Complex Scenario NET-007 — 802.1Q Trunk Native VLAN Mismatch (Time: 1:30 – 3:00)

**Scenario:** Inter-VLAN traffic across switches is failing due to a native VLAN mismatch discovered via CDP syslog.

1. **Switch to Case NET-007:**
   - In the Case Selector dropdown or the **"Cases Library"** tab, search for `"NET-007"` or click **"NET-007: Native VLAN Mismatch on Inter-Switch Trunk"**.
2. **Inspect Evidence & Syslog Output:**
   - Observe the Cisco CDP error:
     ```text
     %CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (99), with ACCESS-SWITCH-01 GigabitEthernet0/1 (1)
     ```
3. **Run Deterministic Checks:**
   - Click **"Run Deterministic Rules"**.
   - **Expected Outcome:** Rule **`RC-07` (Native VLAN Mismatch on 802.1Q Trunk)** triggers with status `FAIL`.
   - The deterministic engine extracts VLAN `99` and VLAN `1` directly from the syslog string.
4. **Run AI Diagnostic Synthesis:**
   - Click **"Run AI Diagnosis"**.
   - **Expected Outcome:** The AI correctly pairs CDP syslog telemetry with `show interfaces trunk` outputs to identify the mismatched PVID on `GigabitEthernet0/1` and prescribes `switchport trunk native vlan 99`.

---

### Phase 3: AI Safety, Hallucination Blocking & Grounding (Time: 3:00 – 4:30)

**Objective:** Demonstrate how NetSage AI blocks hallucinated IP addresses, phantom VLANs, and ungrounded claims.

1. **Simulate an Ungrounded AI Diagnosis via Terminal / API:**
   - Send a synthetic payload with hallucinated IPs (`192.168.99.99` not present in source text) to the AI validation endpoint:
     ```bash
     curl -X POST http://localhost:3000/api/diagnose \
       -H "Content-Type: application/json" \
       -d '{
         "case_id": "NET-001",
         "symptom": "VLAN 30 gateway unreachable",
         "show_outputs": "GigabitEthernet0/0.30 10.10.30.1 YES manual administratively down down",
         "mock_ai_response": {
           "root_cause": "Host 192.168.99.99 is down due to BGP neighbor flap",
           "osi_layer": "Layer 3 (Network)",
           "confidence": "High",
           "evidence": ["Host 192.168.99.99 unreachable on VLAN 999"],
           "next_command": "show ip bgp summary",
           "fix_steps": ["router bgp 65000", "neighbor 192.168.99.99 remote-as 65001"]
         }
       }'
     ```
2. **Inspect the Safety Gate Output:**
   - **Expected Outcome:** The API response marks `hallucination_flag: true`, downgrades confidence to `Low`, prefixes root cause with `[UNSUPPORTED EVIDENCE DETECTED]`, and flags `192.168.99.99` and `VLAN 999` as ungrounded citations.
   - In the web UI, the safety badge turns **Amber/Red** (`"UNGROUNDED EVIDENCE DETECTED — OPERATOR AUDIT REQUIRED"`).

---

### Phase 4: Human-in-the-Loop (HITL) Review Workflow (Time: 4:30 – 6:30)

**Objective:** Demonstrate that no AI remediation is deployed without explicit human authorization, and that operator overrides are fully tracked.

1. **Navigate to the "Human Review Gate" Panel:**
   - Under the AI Diagnosis in the Diagnostics view, locate the **"Remediation Review Gate"** panel.
2. **Test 4.1: Direct Approval (`ACCEPTED`):**
   - Enter Reviewer Name: `Lead NetOps Engineer`.
   - Click **"Approve & Sign Configuration"** (`ACCEPTED`).
   - **Result:** The system transitions to `APPROVED`, calculates a new SHA-256 block hash, and logs the execution to the audit ledger.
3. **Test 4.2: Operator Modification (`EDITED`):**
   - Click **"Edit Remediation Commands"**.
   - Modify the CLI script to include an interface description:
     ```cisco
     configure terminal
     interface GigabitEthernet0/0.30
     description Link to Accounting VLAN30
     no shutdown
     end
     ```
   - Enter Mandatory Reason: `Added enterprise standard interface description prior to bringing link up.`
   - Click **"Sign & Submit Operator Override"** (`EDITED`).
   - **Result:** The ledger captures **both** the original AI commands and the operator-edited commands side-by-side.
4. **Test 4.3: Operator Rejection (`REJECTED`):**
   - Attempt to click **"Reject Proposal"** with an empty reason field.
   - **Result:** The UI prevents submission and highlights the reason field in red: *"Mandatory operator explanation required for remediation rejection."*
   - Enter Reason: `Remediation conflicts with scheduled core router maintenance window.`
   - Submit rejection.
   - **Result:** The rejection decision is signed and appended to the immutable ledger with status `BLOCKED`.

---

### Phase 5: Cryptographic SHA-256 Audit Trail & Tamper Proof (Time: 6:30 – 8:00)

**Objective:** Demonstrate immutable hash chaining and live detection of unauthorized data modifications.

1. **Navigate to the "Audit Trail" View:**
   - In the top navigation bar, click on **"Audit Ledger"** (or view the Audit tab).
2. **Inspect the Cryptographic Chain:**
   - Observe the list of audit blocks. Each block displays:
     - **Block Sequence ID & Timestamp**
     - **Action Type & Human Decision Badge** (`ACCEPTED`, `EDITED`, `REJECTED`)
     - **Previous Block Hash (`previousHash: sha256:...`)**
     - **Current Block Token (`integrityToken: sha256:...`)**
     - **Operator Reviewer Name & Rationale**
3. **Run Live Integrity Verification:**
   - Click the **"Verify Audit Chain Integrity"** button.
   - **Expected Outcome:** A green notification appears: `"Audit Chain Integrity Verified: 100% Cryptographically Intact. 0 Compromised Blocks."`
4. **Demonstrate Automated Tamper Detection:**
   - Run the automated Python audit security test suite in terminal:
     ```bash
     python3 -m unittest tests/test_audit.py
     ```
   - **Expected Outcome:** 8/8 cryptographic tests pass, validating that modified payloads, forged timestamps, corrupted previous hashes, altered CLI commands, deleted blocks, and rogue block insertions are all detected and rejected.

---

### Phase 6: One-Command Master Verification Pipeline (Time: 8:00 – 10:00)

**Objective:** Execute the single authoritative verification command that runs all unit, dataset, safety, audit, and build test suites.

1. **Execute the Master Verification Script:**
   ```bash
   npm run verify
   ```
2. **Observe Real-Time Dynamic Console Output:**
   - The test runner executes the comprehensive test suites sequentially:
     - **Dataset Validation (35 cases, 12 schema columns)**
     - **Deterministic Rule Engine (Rules RC-01 to RC-15 across 66 unit tests)**
     - **Case-ID Independence Verification (Mutated, synthetic, and empty IDs)**
     - **Fuzz & Robustness Suite (16 stress scenarios including 10k+ character payloads)**
     - **AI Safety & Schema Enforcement (11 schema checks + 4 grounding checks)**
     - **Human Review Gate (5 decision state transitions)**
     - **SHA-256 Cryptographic Audit Chain (10 tamper attack scenarios)**
     - **Authoritative Python Reference Checker (35/35 dataset cases)**
     - **Authoritative Python Unit Test Suite (48/48 tests)**
     - **TypeScript Typecheck (`tsc --noEmit`) & Production Build (`vite build`)**
3. **Verify the Final Dynamic Summary Table:**
   ```text
   ============================================================
   NETSAGE AI — FINAL COMPLIANCE VERIFICATION
   ============================================================

   Documentation Consistency       [PASS]
   Dataset Integrity               [PASS]
   Deterministic Rules             [PASS]
   Case-ID Independence            [PASS]
   AI Grounding Safety             [PASS]
   Responsible AI                  [PASS]
   Human Review Gate               [PASS]
   Audit Chain Integrity           [PASS]
   API Verification                [PASS]
   Browser E2E                     [PASS]
   Production Build                [PASS]

   ------------------------------------------------------------
   TOTAL CHECKS EXECUTED: 284
   TOTAL CHECKS PASSED:   284
   TOTAL CHECKS FAILED:   0
   ------------------------------------------------------------

   FINAL STATUS:
   PASS — ALL VERIFICATION SUITES DETERMINISTICALLY PASSED
   ============================================================
   ```

---

## 4. Expected Demonstration Outputs Reference

| Step | Action | Expected Visual / Console Result |
|:---|:---|:---|
| **NET-001 Deterministic** | Run Deterministic Checks | `RC-01: Interface Administratively Shutdown` highlighted in Red (`FAIL`). |
| **NET-001 AI Diagnosis** | Run AI Diagnosis | Structured root cause identifying `Gi0/0.30 administratively down` with `no shutdown` CLI commands. |
| **NET-007 Multi-Layer** | Run Rules & AI | `RC-07: Native VLAN Mismatch` triggered; AI synthesizes CDP syslog with trunk config. |
| **AI Hallucination Gate** | Feed ungrounded IP `192.168.99.99` | Confidence downgraded to `Low`; flagged as `[UNSUPPORTED EVIDENCE]`. |
| **HITL Review: EDITED** | Operator modifies commands | Original commands and modified commands preserved in audit payload. |
| **HITL Review: REJECT** | Submit empty rejection reason | Form validation blocks submission; requires explicit operator explanation. |
| **Audit Verification** | Click "Verify Ledger" | Green badge: `Cryptographically Intact (SHA-256 Chain Valid)`. |
| **CLI Verification** | `npm run verify` | Complete dynamic console matrix showing `PASS` with 0 failures. |

---

## 5. Troubleshooting & Fallback Instructions

### 5.1 Port 3000 Already in Use
If port 3000 is occupied by another process:
```bash
# Terminate existing node process on port 3000
fuser -k 3000/tcp || npx kill-port 3000
npm run dev
```

### 5.2 Python Dependencies Missing
If running Python checks in a minimal environment:
```bash
# Verify Python version (3.10+ recommended)
python3 --version

# Python checker uses standard library modules only (csv, json, re, hashlib, sys, pathlib)
# No external pip dependencies are required for core checker execution.
```

### 5.3 Gemini API Key Configuration
If the Gemini API key is not configured in `.env`, the server automatically utilizes high-fidelity calibrated offline diagnostic inference for all 35 cases, ensuring zero presentation interruption during demonstrations.
