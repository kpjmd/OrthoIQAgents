#!/usr/bin/env node

/**
 * Simple test to verify agent functionality
 */

import { ChatAnthropic } from '@langchain/anthropic';
import dotenv from 'dotenv';

dotenv.config();

async function testAgent() {
  console.log('Testing Claude API connection...\n');
  
  try {
    const llm = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      modelName: 'claude-3-opus-20240229',
      temperature: 0.3,
      maxTokens: 100
    });
    
    console.log('Sending test message...');
    const response = await llm.invoke([
      {
        role: 'system',
        content: 'You are a medical assistant. Respond with a simple JSON object.'
      },
      {
        role: 'user',
        content: 'Patient has knee pain. Provide JSON: {"diagnosis": "...", "urgency": "..."}'
      }
    ]);
    
    console.log('✅ Response received:');
    console.log(response.content);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\nPlease check:');
    console.log('1. ANTHROPIC_API_KEY is set in .env');
    console.log('2. API key has correct permissions');
    console.log('3. Model name is correct');
  }
}

testAgent();