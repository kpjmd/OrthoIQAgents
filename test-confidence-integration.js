#!/usr/bin/env node

/**
 * Integration Test: Confidence Scores in Multi-Specialist Consultation
 *
 * This test validates that confidence scores are unique and meaningful
 * in a realistic consultation scenario.
 */

import { TriageAgent } from './src/agents/triage-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MindMenderAgent } from './src/agents/mind-mender-agent.js';
import { AgentCoordinator } from './src/utils/agent-coordinator.js';

console.log('='.repeat(80));
console.log('INTEGRATION TEST: CONFIDENCE SCORES IN CONSULTATION');
console.log('='.repeat(80));
console.log();

async function testIntegration() {
  // Initialize coordinator and agents
  const coordinator = new AgentCoordinator();

  const triageAgent = new TriageAgent();
  const painAgent = new PainWhispererAgent();
  const movementAgent = new MovementDetectiveAgent();
  const strengthAgent = new StrengthSageAgent();
  const mindAgent = new MindMenderAgent();

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Register agents
  coordinator.registerSpecialist('triage', triageAgent);
  coordinator.registerSpecialist('painWhisperer', painAgent);
  coordinator.registerSpecialist('movementDetective', movementAgent);
  coordinator.registerSpecialist('strengthSage', strengthAgent);
  coordinator.registerSpecialist('mindMender', mindAgent);

  console.log('✓ Agents registered with coordinator\n');

  // Create a realistic case
  const patientCase = {
    id: 'test_case_001',
    primaryComplaint: 'Chronic lower back pain affecting mobility and daily activities',
    symptoms: 'Sharp pain when bending, stiffness in morning, difficulty walking long distances',
    painLevel: 7,
    duration: '6 months',
    location: 'lower back',
    age: 42,
    functionalLimitations: true,
    movementDysfunction: true,
    anxietyLevel: 6
  };

  console.log('Patient Case:');
  console.log('-'.repeat(80));
  console.log(`Primary Complaint: ${patientCase.primaryComplaint}`);
  console.log(`Pain Level: ${patientCase.painLevel}/10`);
  console.log(`Duration: ${patientCase.duration}`);
  console.log(`Anxiety Level: ${patientCase.anxietyLevel}/10`);
  console.log();

  // Test confidence calculation for triage
  console.log('Step 1: Triage Confidence Assessment');
  console.log('-'.repeat(80));

  const triageConfidence = triageAgent.getConfidence('triage_assessment');
  console.log(`Triage Confidence: ${triageConfidence.toFixed(3)}`);
  console.log(`Triage is ${triageConfidence >= 0.8 ? 'highly confident' : 'moderately confident'} in case coordination`);
  console.log();

  // Get individual specialist confidence assessments
  console.log('Step 2: Specialist Assessments');
  console.log('-'.repeat(80));

  const specialists = [
    { agent: painAgent, name: 'Pain Whisperer', task: 'pain_assessment' },
    { agent: movementAgent, name: 'Movement Detective', task: 'movement_analysis' },
    { agent: strengthAgent, name: 'Strength Sage', task: 'functional_assessment' },
    { agent: mindAgent, name: 'Mind Mender', task: 'psychological_assessment' }
  ];

  const confidenceScores = [];
  for (const { agent, name, task } of specialists) {
    const confidence = agent.getConfidence(task);
    confidenceScores.push({ name, confidence });
    console.log(`${name.padEnd(25)} | Confidence: ${confidence.toFixed(3)}`);
  }

  console.log();

  // Validate uniqueness
  console.log('Validation Results:');
  console.log('-'.repeat(80));

  const uniqueScores = new Set(confidenceScores.map(s => s.confidence));
  const allUnique = uniqueScores.size === confidenceScores.length;

  console.log(`✓ Number of specialists: ${confidenceScores.length}`);
  console.log(`✓ Unique confidence scores: ${uniqueScores.size}`);
  console.log(`${allUnique ? '✓' : '✗'} All scores are unique: ${allUnique ? 'YES' : 'NO'}`);

  // Check if scores are within reasonable range
  const allInRange = confidenceScores.every(s => s.confidence >= 0.5 && s.confidence <= 1.0);
  console.log(`${allInRange ? '✓' : '✗'} All scores in valid range (0.5-1.0): ${allInRange ? 'YES' : 'NO'}`);

  // Check score spread (should have meaningful differences)
  const scores = confidenceScores.map(s => s.confidence).sort();
  const minScore = scores[0];
  const maxScore = scores[scores.length - 1];
  const spread = maxScore - minScore;
  const meaningfulSpread = spread >= 0.05; // At least 5% difference

  console.log(`✓ Confidence range: ${minScore.toFixed(3)} - ${maxScore.toFixed(3)}`);
  console.log(`${meaningfulSpread ? '✓' : '✗'} Meaningful spread (>5%): ${meaningfulSpread ? 'YES' : 'NO'} (${(spread * 100).toFixed(1)}%)`);

  console.log();

  // Display comparison
  console.log('Specialist Confidence Comparison:');
  console.log('-'.repeat(80));

  const sortedScores = [...confidenceScores].sort((a, b) => b.confidence - a.confidence);
  sortedScores.forEach((s, i) => {
    const bar = '█'.repeat(Math.round(s.confidence * 50));
    console.log(`${(i + 1)}. ${s.name.padEnd(25)} ${bar} ${s.confidence.toFixed(3)}`);
  });

  console.log();
  console.log('='.repeat(80));
  console.log('INTEGRATION TEST RESULTS');
  console.log('='.repeat(80));

  const passed = allUnique && allInRange && meaningfulSpread;

  console.log(`Unique Scores:        ${allUnique ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Valid Range:          ${allInRange ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Meaningful Spread:    ${meaningfulSpread ? '✓ PASS' : '✗ FAIL'}`);
  console.log();
  console.log(`Overall: ${passed ? '✓ INTEGRATION TEST PASSED' : '✗ INTEGRATION TEST FAILED'}`);
  console.log('='.repeat(80));

  process.exit(passed ? 0 : 1);
}

// Run integration test
testIntegration().catch(error => {
  console.error('Integration test error:', error);
  process.exit(1);
});
