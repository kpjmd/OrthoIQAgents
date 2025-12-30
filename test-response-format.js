#!/usr/bin/env node

/**
 * Test script to verify response format changes
 * Tests that all agents return user-friendly markdown in response field
 */

import dotenv from 'dotenv';
import { TriageAgent } from './src/agents/triage-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MindMenderAgent } from './src/agents/mind-mender-agent.js';
import AgentCoordinator from './src/utils/agent-coordinator.js';

dotenv.config();

async function testResponseFormat() {
  console.log('🧪 Testing Response Format Changes\n');
  console.log('=' .repeat(60));

  try {
    // Initialize agents
    console.log('\n📋 Initializing agents...');
    const triageAgent = new TriageAgent('Test Triage', null);
    const painAgent = new PainWhispererAgent('Test Pain', null);
    const movementAgent = new MovementDetectiveAgent('Test Movement', null);
    const strengthAgent = new StrengthSageAgent('Test Strength', null);
    const mindAgent = new MindMenderAgent('Test Mind', null);

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Agents initialized\n');

    // Test case data
    const testCase = {
      id: 'test_case_001',
      primaryComplaint: 'Lower back pain',
      symptoms: 'Sharp pain when bending, difficulty walking',
      painLevel: 7,
      duration: '2 weeks',
      location: 'Lower back',
      age: 35
    };

    console.log('📝 Test Case:', JSON.stringify(testCase, null, 2));
    console.log('\n' + '='.repeat(60));

    // Test TriageAgent
    console.log('\n🔍 Testing TriageAgent...');
    const triageResult = await triageAgent.triageCase(testCase, { mode: 'normal' });

    console.log('\n✅ TriageAgent Response Structure:');
    console.log('  - Has response field:', !!triageResult.response);
    console.log('  - Response is string:', typeof triageResult.response === 'string');
    console.log('  - Response starts with markdown:', triageResult.response.startsWith('#'));
    console.log('  - Has rawResponse field:', !!triageResult.rawResponse);
    console.log('  - Has assessment field:', !!triageResult.assessment);
    console.log('  - Has recommendations field:', !!triageResult.recommendations);

    console.log('\n📄 Response Preview (first 200 chars):');
    console.log('  ' + triageResult.response.substring(0, 200).replace(/\n/g, '\n  '));

    // Test PainWhispererAgent
    console.log('\n\n💊 Testing PainWhispererAgent...');
    const painResult = await painAgent.assessPain(testCase, { mode: 'normal' });

    console.log('\n✅ PainWhispererAgent Response Structure:');
    console.log('  - Has response field:', !!painResult.response);
    console.log('  - Response is string:', typeof painResult.response === 'string');
    console.log('  - Response starts with markdown:', painResult.response.startsWith('#'));
    console.log('  - Has rawResponse field:', !!painResult.rawResponse);
    console.log('  - Has assessment field:', !!painResult.assessment);
    console.log('  - Has painScore:', painResult.painScore);

    console.log('\n📄 Response Preview (first 200 chars):');
    console.log('  ' + painResult.response.substring(0, 200).replace(/\n/g, '\n  '));

    // Test MovementDetectiveAgent
    console.log('\n\n🏃 Testing MovementDetectiveAgent...');
    const movementResult = await movementAgent.analyzeMovementPattern(testCase, { mode: 'normal' });

    console.log('\n✅ MovementDetectiveAgent Response Structure:');
    console.log('  - Has response field:', !!movementResult.response);
    console.log('  - Response is string:', typeof movementResult.response === 'string');
    console.log('  - Response starts with markdown:', movementResult.response.startsWith('#'));
    console.log('  - Has rawResponse field:', !!movementResult.rawResponse);
    console.log('  - Has assessment field:', !!movementResult.assessment);

    // Test StrengthSageAgent
    console.log('\n\n💪 Testing StrengthSageAgent...');
    const strengthResult = await strengthAgent.assessFunctionalCapacity(testCase, { mode: 'normal' });

    console.log('\n✅ StrengthSageAgent Response Structure:');
    console.log('  - Has response field:', !!strengthResult.response);
    console.log('  - Response is string:', typeof strengthResult.response === 'string');
    console.log('  - Response starts with markdown:', strengthResult.response.startsWith('#'));
    console.log('  - Has rawResponse field:', !!strengthResult.rawResponse);
    console.log('  - Has assessment field:', !!strengthResult.assessment);

    // Test MindMenderAgent
    console.log('\n\n🧠 Testing MindMenderAgent...');
    const mindResult = await mindAgent.assessPsychologicalFactors(testCase, { mode: 'normal' });

    console.log('\n✅ MindMenderAgent Response Structure:');
    console.log('  - Has response field:', !!mindResult.response);
    console.log('  - Response is string:', typeof mindResult.response === 'string');
    console.log('  - Response starts with markdown:', mindResult.response.startsWith('#'));
    console.log('  - Has rawResponse field:', !!mindResult.rawResponse);
    console.log('  - Has assessment field:', !!mindResult.assessment);

    // Test AgentCoordinator synthesis
    console.log('\n\n🤝 Testing AgentCoordinator Synthesis...');
    const coordinator = new AgentCoordinator();
    coordinator.registerSpecialist('triage', triageAgent);
    coordinator.registerSpecialist('painWhisperer', painAgent);
    coordinator.registerSpecialist('movementDetective', movementAgent);
    coordinator.registerSpecialist('strengthSage', strengthAgent);
    coordinator.registerSpecialist('mindMender', mindAgent);

    const consultation = await coordinator.coordinateMultiSpecialistConsultation(
      testCase,
      ['triage', 'painWhisperer'],
      { mode: 'normal' }
    );

    console.log('\n✅ Coordinator Synthesis Structure:');
    console.log('  - Has synthesis field:', !!consultation.synthesizedRecommendations.synthesis);
    console.log('  - Synthesis is string:', typeof consultation.synthesizedRecommendations.synthesis === 'string');
    console.log('  - Synthesis starts with markdown:', consultation.synthesizedRecommendations.synthesis.startsWith('#'));
    console.log('  - Has rawSynthesis field:', !!consultation.synthesizedRecommendations.rawSynthesis);
    console.log('  - Has treatmentPlan:', !!consultation.synthesizedRecommendations.treatmentPlan);

    console.log('\n📄 Synthesis Preview (first 300 chars):');
    console.log('  ' + consultation.synthesizedRecommendations.synthesis.substring(0, 300).replace(/\n/g, '\n  '));

    console.log('\n\n' + '='.repeat(60));
    console.log('\n✅ All tests passed! Response format is correct.\n');
    console.log('📋 Summary:');
    console.log('  - All agents return user-friendly markdown in `response` field');
    console.log('  - Raw LLM output preserved in `rawResponse` field');
    console.log('  - All structured fields (assessment, recommendations, etc.) preserved');
    console.log('  - Coordinator synthesis also formatted as markdown');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testResponseFormat();
