#!/usr/bin/env node

/**
 * Test: Agent Confidence Score Uniqueness
 *
 * This test validates that each specialist agent now has unique confidence scores
 * based on their individual expertise and domain specialization.
 */

import { TriageAgent } from './src/agents/triage-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MindMenderAgent } from './src/agents/mind-mender-agent.js';

console.log('='.repeat(80));
console.log('TESTING AGENT CONFIDENCE SCORE UNIQUENESS');
console.log('='.repeat(80));
console.log();

async function testConfidenceScores() {
  // Initialize all agents
  const triageAgent = new TriageAgent();
  const painAgent = new PainWhispererAgent();
  const movementAgent = new MovementDetectiveAgent();
  const strengthAgent = new StrengthSageAgent();
  const mindAgent = new MindMenderAgent();

  // Wait for agents to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✓ All agents initialized\n');

  // Test 1: Each agent should have different confidence for their own domain
  console.log('TEST 1: Domain-Specific Confidence (In-Domain Tasks)');
  console.log('-'.repeat(80));

  const domainTasks = [
    { agent: triageAgent, name: 'Triage', task: 'triage_assessment' },
    { agent: painAgent, name: 'Pain Whisperer', task: 'pain_assessment' },
    { agent: movementAgent, name: 'Movement Detective', task: 'movement_analysis' },
    { agent: strengthAgent, name: 'Strength Sage', task: 'functional_assessment' },
    { agent: mindAgent, name: 'Mind Mender', task: 'psychological_assessment' }
  ];

  const inDomainScores = [];
  for (const { agent, name, task } of domainTasks) {
    const confidence = agent.getConfidence(task);
    inDomainScores.push({ name, confidence, task });
    console.log(`${name.padEnd(25)} | Task: ${task.padEnd(25)} | Confidence: ${confidence.toFixed(3)}`);
  }

  // Verify all scores are different
  const uniqueInDomain = new Set(inDomainScores.map(s => s.confidence));
  const allDifferentInDomain = uniqueInDomain.size === inDomainScores.length;

  console.log();
  console.log(`Result: ${allDifferentInDomain ? '✓ PASS' : '✗ FAIL'} - ${allDifferentInDomain ? 'All agents have unique in-domain confidence scores' : 'Some agents have duplicate scores'}`);
  console.log();

  // Test 2: Each agent should have lower confidence for out-of-domain medical tasks
  console.log('TEST 2: Out-of-Domain Medical Tasks');
  console.log('-'.repeat(80));

  // Each agent gets a task from another specialist's domain
  const outDomainTasks = [
    { agent: triageAgent, name: 'Triage', task: 'pain_assessment' }, // Not triage's primary domain
    { agent: painAgent, name: 'Pain Whisperer', task: 'movement_analysis' }, // Not pain's domain
    { agent: movementAgent, name: 'Movement Detective', task: 'psychological_assessment' }, // Not movement's domain
    { agent: strengthAgent, name: 'Strength Sage', task: 'pain_assessment' }, // Not strength's primary domain
    { agent: mindAgent, name: 'Mind Mender', task: 'functional_assessment' } // Not psych's domain
  ];

  const outDomainScores = [];
  for (const { agent, name, task } of outDomainTasks) {
    const confidence = agent.getConfidence(task);
    outDomainScores.push({ name, confidence, task });
    console.log(`${name.padEnd(25)} | Task: ${task.padEnd(25)} | Confidence: ${confidence.toFixed(3)}`);
  }

  const uniqueOutDomain = new Set(outDomainScores.map(s => s.confidence));
  const allDifferentOutDomain = uniqueOutDomain.size === outDomainScores.length;

  console.log();
  console.log(`Result: ${allDifferentOutDomain ? '✓ PASS' : '✗ FAIL'} - ${allDifferentOutDomain ? 'All agents have unique out-of-domain scores' : 'Some agents have duplicate scores'}`);
  console.log();

  // Test 3: Each agent should have higher confidence in their domain vs out-of-domain
  console.log('TEST 3: In-Domain vs Out-of-Domain Comparison');
  console.log('-'.repeat(80));

  let allHigherInDomain = true;
  for (let i = 0; i < domainTasks.length; i++) {
    const inDomain = inDomainScores[i].confidence;
    const outDomain = outDomainScores[i].confidence;
    const higher = inDomain > outDomain;
    const diff = ((inDomain - outDomain) * 100).toFixed(1);

    console.log(`${domainTasks[i].name.padEnd(25)} | In-Domain: ${inDomain.toFixed(3)} | Out-Domain: ${outDomain.toFixed(3)} | ${higher ? '✓' : '✗'} ${diff}% higher`);

    if (!higher) allHigherInDomain = false;
  }

  console.log();
  console.log(`Result: ${allHigherInDomain ? '✓ PASS' : '✗ FAIL'} - ${allHigherInDomain ? 'All agents have higher confidence in their domain' : 'Some agents do not have higher in-domain confidence'}`);
  console.log();

  // Test 4: Confidence varies for completely unrelated tasks
  console.log('TEST 4: Unrelated Task Confidence (Non-Medical Task)');
  console.log('-'.repeat(80));

  const unrelatedTask = 'cooking_recipes';
  const unrelatedScores = [];

  for (const { agent, name } of domainTasks) {
    const confidence = agent.getConfidence(unrelatedTask);
    unrelatedScores.push({ name, confidence });
    console.log(`${name.padEnd(25)} | Task: ${unrelatedTask.padEnd(25)} | Confidence: ${confidence.toFixed(3)}`);
  }

  const uniqueUnrelated = new Set(unrelatedScores.map(s => s.confidence));
  const allDifferentUnrelated = uniqueUnrelated.size === unrelatedScores.length;

  console.log();
  console.log(`Result: ${allDifferentUnrelated ? '✓ PASS' : '✗ FAIL'} - ${allDifferentUnrelated ? 'All agents have unique confidence scores for unrelated tasks' : 'Some agents have duplicate scores'}`);
  console.log();

  // Test 5: Historical accuracy affects confidence
  console.log('TEST 5: Historical Accuracy Impact');
  console.log('-'.repeat(80));

  // Get baseline
  const baselineConfidence = painAgent.getConfidence('pain_assessment');
  console.log(`Pain Whisperer baseline confidence: ${baselineConfidence.toFixed(3)}`);

  // Simulate successful assessment
  painAgent.painTrackingHistory.push({
    assessmentId: 'test_123',
    painScore: 7,
    riskLevel: 'moderate',
    timestamp: new Date().toISOString()
  });

  const improvedConfidence = painAgent.getConfidence('pain_assessment');
  console.log(`Pain Whisperer confidence after assessment: ${improvedConfidence.toFixed(3)}`);

  const confidenceIncreased = improvedConfidence > baselineConfidence;
  console.log();
  console.log(`Result: ${confidenceIncreased ? '✓ PASS' : '✗ FAIL'} - ${confidenceIncreased ? 'Historical accuracy increases confidence' : 'Historical accuracy does not affect confidence'}`);
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const allPassed = allDifferentInDomain && allDifferentOutDomain && allHigherInDomain && allDifferentUnrelated && confidenceIncreased;

  console.log(`Test 1 (In-Domain Uniqueness):      ${allDifferentInDomain ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test 2 (Out-of-Domain Uniqueness):  ${allDifferentOutDomain ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test 3 (Domain Superiority):        ${allHigherInDomain ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test 4 (Unrelated Task Uniqueness): ${allDifferentUnrelated ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test 5 (Historical Impact):         ${confidenceIncreased ? '✓ PASS' : '✗ FAIL'}`);
  console.log();
  console.log(`Overall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  console.log('='.repeat(80));

  process.exit(allPassed ? 0 : 1);
}

// Run tests
testConfidenceScores().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
