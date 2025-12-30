#!/usr/bin/env node

/**
 * Test a single consultation with detailed timing
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

// Simple test case
const testCase = {
  caseData: {
    age: 45,
    gender: 'male',
    primaryComplaint: 'knee pain when running',
    symptoms: ['knee pain'],
    painLevel: 6,
    location: 'left knee', 
    duration: '2 weeks',
    urgency: 'routine',
    complexity: 5
  },
  requiredSpecialists: ['triage'], // Just one specialist for simplicity
  mode: 'fast'
};

async function testSingleConsultation() {
  console.log('🧪 Testing single consultation with detailed timing\n');
  
  const startTime = Date.now();
  
  try {
    console.log('Sending consultation request...');
    const response = await fetch(`${API_URL}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });
    
    const result = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log(`\n⏱️ Total Response Time: ${totalTime}ms`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
    } else {
      console.log(`✅ Success: ${result.success}`);
      console.log(`   From Cache: ${result.fromCache || false}`);
      console.log(`   Mode: ${result.mode || 'unknown'}`);
      console.log(`   Response Time (API): ${result.responseTime}ms`);
      
      if (result.consultation) {
        console.log(`   Specialists: ${result.consultation.participatingSpecialists?.length || 0}`);
        console.log(`   Duration: ${result.consultation.duration || 'N/A'}ms`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Time before failure: ${totalTime}ms`);
  }
}

testSingleConsultation();