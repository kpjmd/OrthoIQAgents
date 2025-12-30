#!/usr/bin/env node

/**
 * Test different timeout scenarios to find optimal settings
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

// Test cases with varying complexity
const testCases = [
  {
    name: 'Simple Case',
    caseData: {
      age: 30,
      gender: 'female',
      primaryComplaint: 'knee pain',
      symptoms: ['knee pain'],
      painLevel: 5,
      location: 'right knee',
      duration: '1 week',
      complexity: 3
    },
    requiredSpecialists: ['triage']
  },
  {
    name: 'Moderate Case', 
    caseData: {
      age: 45,
      gender: 'male',
      primaryComplaint: 'knee pain when running',
      symptoms: ['knee pain', 'swelling', 'stiffness'],
      painLevel: 6,
      location: 'left knee',
      duration: '2 weeks',
      complexity: 5
    },
    requiredSpecialists: ['triage', 'painWhisperer']
  },
  {
    name: 'Complex Case',
    caseData: {
      age: 55,
      gender: 'male', 
      primaryComplaint: 'chronic knee pain with multiple issues',
      symptoms: ['knee pain', 'swelling', 'stiffness', 'instability', 'clicking'],
      painLevel: 8,
      location: 'both knees',
      duration: '6 months',
      complexity: 8
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective']
  }
];

async function testTimeouts() {
  console.log('🕐 Timeout Analysis - Finding Optimal Settings\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Specialists: ${testCase.requiredSpecialists.length}`);
    console.log(`Complexity: ${testCase.caseData.complexity}`);
    
    const startTime = Date.now();
    
    try {
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
        error: result.error || null
      };
      
      results.push(testResult);
      
      if (testResult.success) {
        console.log(`✅ Success: ${totalTime}ms`);
        if (result.consultation) {
          console.log(`   Duration: ${result.consultation.duration}ms`);
          console.log(`   Participating: ${result.consultation.participatingSpecialists?.length || 0}`);
        }
      } else {
        console.log(`❌ Failed: ${totalTime}ms - ${testResult.error}`);
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
        error: error.message
      });
      
      console.log(`❌ Exception: ${totalTime}ms - ${error.message}\n`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Analyze results
  console.log('📊 TIMEOUT ANALYSIS RESULTS\n');
  console.log('Case                | Specialists | Complexity | Time(ms) | Success | Notes');
  console.log('-------------------|-------------|------------|----------|---------|--------');
  
  let successTimes = [];
  let failureTimes = [];
  
  results.forEach(result => {
    const success = result.success ? '✅' : '❌';
    const notes = result.fromCache ? 'CACHED' : result.error ? result.error.substring(0, 15) : '';
    
    console.log(`${result.name.padEnd(18)} | ${result.specialists.toString().padEnd(11)} | ${result.complexity.toString().padEnd(10)} | ${result.totalTime.toString().padEnd(8)} | ${success.padEnd(7)} | ${notes}`);
    
    if (result.success && !result.fromCache) {
      successTimes.push(result.totalTime);
    } else if (!result.success) {
      failureTimes.push(result.totalTime);
    }
  });
  
  console.log('\n📈 TIMEOUT RECOMMENDATIONS');
  
  if (successTimes.length > 0) {
    const avgSuccess = Math.round(successTimes.reduce((a, b) => a + b, 0) / successTimes.length);
    const maxSuccess = Math.max(...successTimes);
    const minSuccess = Math.min(...successTimes);
    
    console.log(`Average successful response time: ${avgSuccess}ms`);
    console.log(`Range: ${minSuccess}ms - ${maxSuccess}ms`);
    console.log(`Recommended timeout: ${Math.round(maxSuccess * 1.5)}ms (150% of max successful)`);
  }
  
  if (failureTimes.length > 0) {
    const avgFailure = Math.round(failureTimes.reduce((a, b) => a + b, 0) / failureTimes.length);
    console.log(`Average failure time: ${avgFailure}ms`);
  }
  
  console.log(`\nSuccess rate: ${Math.round((results.filter(r => r.success).length / results.length) * 100)}%`);
}

testTimeouts().catch(console.error);