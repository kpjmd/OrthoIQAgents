#!/usr/bin/env node

/**
 * Test all 5 AI agents to analyze performance when fully utilizing the training ecosystem
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

// Test cases designed to trigger all 5 specialists
const testCases = [
  {
    name: 'Comprehensive Case - All 5 Agents',
    description: 'Complex case requiring triage, pain management, movement analysis, strength training, and psychological support',
    caseData: {
      age: 45,
      gender: 'male',
      primaryComplaint: 'chronic knee pain affecting work and mental health',
      symptoms: [
        'severe knee pain',
        'swelling and stiffness', 
        'difficulty walking/stairs',
        'muscle weakness',
        'anxiety about injury',
        'depression from activity limitation',
        'fear of reinjury'
      ],
      painLevel: 8,
      location: 'right knee',
      duration: '4 months',
      functionalLimitations: ['cannot run', 'difficulty with stairs', 'limited walking distance'],
      psychologicalFactors: ['anxiety', 'depression', 'fear avoidance'],
      movementDysfunction: true,
      strengthDeficits: true,
      chronicPain: true,
      complexity: 9,
      urgency: 'urgent'
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender']
  },
  {
    name: 'Multi-System Case - All 5 Agents',
    description: 'Athletic injury requiring comprehensive multi-disciplinary approach',
    caseData: {
      age: 28,
      gender: 'female',
      primaryComplaint: 'running injury with multiple complications',
      symptoms: [
        'knee pain during activity',
        'hip dysfunction', 
        'gait abnormalities',
        'performance anxiety',
        'loss of athletic identity'
      ],
      painLevel: 6,
      location: 'knee and hip',
      duration: '6 weeks',
      functionalLimitations: ['cannot run', 'altered gait', 'compensatory patterns'],
      psychologicalFactors: ['performance anxiety', 'identity crisis'],
      movementDysfunction: true,
      strengthDeficits: true,
      athleticGoals: true,
      complexity: 8,
      urgency: 'routine'
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender']
  },
  {
    name: 'Post-Surgical Case - All 5 Agents', 
    description: 'Post-operative recovery requiring comprehensive rehabilitation',
    caseData: {
      age: 55,
      gender: 'male',
      primaryComplaint: 'post-surgical knee recovery complications',
      symptoms: [
        'persistent post-op pain',
        'limited range of motion',
        'muscle atrophy',
        'fear of movement', 
        'frustration with progress'
      ],
      painLevel: 7,
      location: 'surgical knee',
      duration: '3 months post-op',
      functionalLimitations: ['limited ROM', 'strength loss', 'mobility issues'],
      psychologicalFactors: ['kinesiophobia', 'frustration', 'depression'],
      movementDysfunction: true,
      strengthDeficits: true,
      postSurgical: true,
      complexity: 9,
      urgency: 'routine'
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender']
  }
];

async function testAllAgents() {
  console.log('🤖 Testing All 5 AI Agents - Training Ecosystem Performance\n');
  console.log('Specialists: Triage, Pain Whisperer, Movement Detective, Strength Sage, Mind Mender\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.name}`);
    console.log(`📋 ${testCase.description}`);
    console.log(`👥 Specialists Required: ${testCase.requiredSpecialists.length}`);
    console.log(`🔥 Complexity: ${testCase.caseData.complexity}/10`);
    
    const startTime = Date.now();
    
    try {
      console.log('⏳ Processing with all 5 AI agents...');
      
      const response = await fetch(`${API_URL}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testCase,
          mode: 'fast'
        })
      });
      
      const result = await response.json();
      const totalTime = Date.now() - startTime;
      
      const testResult = {
        name: testCase.name,
        specialists: testCase.requiredSpecialists.length,
        complexity: testCase.caseData.complexity,
        totalTime,
        success: !result.error,
        fromCache: result.fromCache || false,
        error: result.error || null,
        participatingAgents: result.consultation?.participatingSpecialists?.length || 0,
        coordinationTime: result.consultation?.duration || 0
      };
      
      results.push(testResult);
      
      if (testResult.success) {
        console.log(`✅ SUCCESS`);
        console.log(`   ⏱️  Total Response Time: ${totalTime}ms`);
        console.log(`   🤖 Participating Agents: ${testResult.participatingAgents}/5`);
        console.log(`   🔄 Coordination Time: ${testResult.coordinationTime}ms`);
        console.log(`   💾 From Cache: ${result.fromCache || false}`);
        
        if (result.consultation?.synthesizedRecommendations) {
          console.log(`   🧠 Synthesis Quality: ${result.consultation.synthesizedRecommendations.confidence || 'N/A'}`);
          console.log(`   📊 Consensus Level: ${result.consultation.synthesizedRecommendations.consensusLevel || 'N/A'}`);
        }
      } else {
        console.log(`❌ FAILED: ${testResult.error}`);
        console.log(`   ⏱️  Time to Failure: ${totalTime}ms`);
      }
      
      console.log('');
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      results.push({
        name: testCase.name,
        specialists: testCase.requiredSpecialists.length,
        complexity: testCase.caseData.complexity,
        totalTime,
        success: false,
        fromCache: false,
        error: error.message,
        participatingAgents: 0,
        coordinationTime: 0
      });
      
      console.log(`❌ EXCEPTION: ${error.message}`);
      console.log(`   ⏱️  Time before failure: ${totalTime}ms\n`);
    }
    
    // Wait between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Performance Analysis
  console.log('📊 ALL-AGENT PERFORMANCE ANALYSIS\n');
  console.log('Case                           | Agents | Complexity | Time(ms) | Success | Participating | Notes');
  console.log('-------------------------------|--------|------------|----------|---------|---------------|--------');
  
  let successTimes = [];
  let failureTimes = [];
  let totalAgentsUtilized = 0;
  
  results.forEach(result => {
    const success = result.success ? '✅' : '❌';
    const notes = result.fromCache ? 'CACHED' : result.error ? result.error.substring(0, 10) : 'SUCCESS';
    
    console.log(`${result.name.padEnd(30)} | ${result.specialists.toString().padEnd(6)} | ${result.complexity.toString().padEnd(10)} | ${result.totalTime.toString().padEnd(8)} | ${success.padEnd(7)} | ${result.participatingAgents.toString().padEnd(13)} | ${notes}`);
    
    if (result.success && !result.fromCache) {
      successTimes.push(result.totalTime);
      totalAgentsUtilized += result.participatingAgents;
    } else if (!result.success) {
      failureTimes.push(result.totalTime);
    }
  });
  
  console.log('\n🎯 TRAINING ECOSYSTEM PERFORMANCE METRICS');
  
  if (successTimes.length > 0) {
    const avgTime = Math.round(successTimes.reduce((a, b) => a + b, 0) / successTimes.length);
    const maxTime = Math.max(...successTimes);
    const minTime = Math.min(...successTimes);
    const avgAgentsPerCase = Math.round(totalAgentsUtilized / successTimes.length);
    
    console.log(`📈 Response Time Performance:`);
    console.log(`   • Average: ${avgTime}ms`);
    console.log(`   • Range: ${minTime}ms - ${maxTime}ms`);
    console.log(`   • Difference vs 3-agent cases: +${Math.max(0, avgTime - 24000)}ms`);
    
    console.log(`\n🤖 Agent Utilization:`);
    console.log(`   • Average agents per case: ${avgAgentsPerCase}/5`);
    console.log(`   • Agent utilization rate: ${(avgAgentsPerCase/5*100).toFixed(1)}%`);
    
    console.log(`\n🏆 Training Benefits:`);
    console.log(`   • All 5 agents trainable: ${avgAgentsPerCase >= 4 ? '✅' : '⚠️'}`);
    console.log(`   • Coordination scalability: ${maxTime < 45000 ? '✅' : '⚠️'}`);
    console.log(`   • System reliability: ${results.filter(r => r.success).length === results.length ? '✅' : '⚠️'}`);
  }
  
  const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
  console.log(`\n📊 Overall Success Rate: ${successRate}%`);
  
  if (successTimes.length > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (successTimes[0] > 30000) {
      console.log(`   • Consider increasing timeout buffer for 5-agent cases`);
    }
    if (totalAgentsUtilized / successTimes.length < 4.5) {
      console.log(`   • Some agents may need case routing optimization`);
    }
    console.log(`   • Current configuration suitable for full training ecosystem`);
  }
}

testAllAgents().catch(console.error);