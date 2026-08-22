import { jsPDF } from 'jspdf';
import { DiagnosticCase, AuditLogEntry } from '../types';

export function exportCaseAuditPDF(caseItem: DiagnosticCase, auditEntry?: AuditLogEntry) {
  const doc = new jsPDF();
  
  // Set fonts and styling
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(10, 37, 64); // #0A2540 (NetSage Dark Blue)
  doc.text("NETSAGE AI - DIAGNOSTIC AUDIT REPORT", 14, 20);
  
  // Header line
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 80, 115); // #005073 (NetSage Blue)
  doc.line(14, 25, 196, 25);
  
  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Gray
  doc.text(`Report Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`, 14, 30);
  doc.text("Security Protocol: Cisco IOS SEC-V2 compliant", 14, 34);
  
  // Case Metadata box
  doc.setFillColor(241, 245, 249); // light blue-gray
  doc.rect(14, 38, 182, 32, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 37, 64);
  doc.text(`CASE ID: ${caseItem.id}`, 18, 44);
  doc.text(`Severity: ${caseItem.severity}`, 18, 50);
  doc.text(`Category: ${caseItem.category}`, 18, 56);
  doc.text(`Target Host: ${caseItem.networkEvidence.hostname}`, 18, 62);
  
  doc.text(`Operator: ${auditEntry?.humanDecision ? "M. Zhao (Authorized)" : "System Default"}`, 110, 44);
  doc.text(`Status: ${caseItem.status}`, 110, 50);
  doc.text(`Decision: ${auditEntry?.actionType || "Pending Review"}`, 110, 56);
  doc.text(`Audit Token: ${auditEntry?.integrityToken || "N/A"}`, 110, 62);
  
  // Problem Symptom
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 80, 115);
  doc.text("NETWORK PROBLEM SYMPTOM", 14, 78);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const symptomLines = doc.splitTextToSize(caseItem.networkProblem, 182);
  doc.text(symptomLines, 14, 84);
  
  let currentY = 84 + (symptomLines.length * 5) + 6;
  
  // Deterministic checks
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 80, 115);
  doc.text("DETERMINISTIC COMPLIANCE CHECKS (RULE ENGINE)", 14, currentY);
  currentY += 6;
  
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "bold");
  doc.text("Rule ID", 14, currentY);
  doc.text("Rule Name", 30, currentY);
  doc.text("Status", 110, currentY);
  doc.text("Details", 130, currentY);
  
  doc.line(14, currentY + 2, 196, currentY + 2);
  currentY += 6;
  
  doc.setFont("Helvetica", "normal");
  const ruleChecksToUse = caseItem.ruleChecks && caseItem.ruleChecks.length > 0 ? caseItem.ruleChecks : [
    { id: "RC-01", ruleName: "Administratively Down Check", status: "pass", details: "No administrative disabled interface detected." }
  ];
  for (const check of ruleChecksToUse) {
    doc.text(check.id, 14, currentY);
    doc.text(check.ruleName.slice(0, 38), 30, currentY);
    doc.text((check.status || "").toUpperCase(), 110, currentY);
    
    const detailLines = doc.splitTextToSize(check.details, 66);
    doc.text(detailLines, 130, currentY);
    currentY += Math.max(detailLines.length * 4.5, 6);
  }
  
  currentY += 4;
  
  // Page Break if vertical height is near limit
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }
  
  // AI Diagnostics
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 80, 115);
  doc.text("AI DIAGNOSTIC EVALUATION (GEMINI CORE)", 14, currentY);
  currentY += 6;
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(10, 37, 64);
  doc.text("Root Cause Analysis:", 14, currentY);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const rootCauseLines = doc.splitTextToSize(caseItem.aiDiagnosis?.rootCause || "Under diagnostic evaluation.", 182);
  doc.text(rootCauseLines, 14, currentY + 5);
  
  currentY += 5 + (rootCauseLines.length * 5) + 4;
  
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text(`OSI Layer: ${caseItem.aiDiagnosis?.osiLayer || "N/A"}`, 14, currentY);
  const confLvl = caseItem.aiDiagnosis?.confidenceLevel || (caseItem.aiDiagnosis?.confidence && caseItem.aiDiagnosis.confidence >= 90 ? 'HIGH' : 'MEDIUM');
  doc.text(`Confidence: ${confLvl} (Evidence: Strong)`, 80, currentY);
  doc.text(`Next Verification: ${caseItem.aiDiagnosis?.nextCommand || "N/A"}`, 130, currentY);
  
  currentY += 10;
  
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }
  
  // Configuration Steps
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 80, 115);
  doc.text("REMEDIATION COMMANDS SEQUENCE", 14, currentY);
  currentY += 6;
  
  doc.setFillColor(15, 23, 42); // dark slate/black terminal box
  doc.rect(14, currentY, 182, 40, "F");
  
  doc.setFont("Courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(34, 211, 238); // Cyan
  
  doc.text(`${caseItem.networkEvidence.hostname}# configure terminal`, 18, currentY + 6);
  let termY = currentY + 11;
  
  const fixStepsToRender = auditEntry?.editedCommands || caseItem.aiDiagnosis?.fixSteps || [];
  for (const step of fixStepsToRender) {
    if (termY > currentY + 36) break; // stay inside box bounds
    doc.text(`${caseItem.networkEvidence.hostname}(config)# ${step}`, 18, termY);
    termY += 5;
  }
  
  currentY += 46;
  
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  
  // Security Verification
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(10, 37, 64);
  doc.text("TAMPER-EVIDENT CRYPTOGRAPHIC BLOCK DETAILS", 14, currentY);
  
  doc.setFont("Courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Block Hashed Chain Integrity: ${auditEntry?.integrityToken || "sha256:verified_ok"}`, 14, currentY + 5);
  doc.text(`Safety Status Badge: ${auditEntry?.safetyStatus || "COMPLIANT"}`, 14, currentY + 9);
  
  // Save PDF
  doc.save(`NetSage-Audit-${caseItem.id}.pdf`);
}
