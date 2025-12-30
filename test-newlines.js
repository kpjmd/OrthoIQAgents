import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';

const userQuestion = "55yo with chronic 6/10 wrist pain for 9 months. I have an old scapholunate injury and now the pain and stiffness is getting worse. I'm worried I may lose my job. What are my treatment options?";

async function testNewlines() {
  const caseData = {
    id: 'newline_test',
    rawQuery: userQuestion,
    enableDualTrack: true,
    age: 55,
    painLevel: 6,
    duration: '9 months'
  };

  const painAgent = new PainWhispererAgent();
  const result = await painAgent.assessPain(caseData);
  
  console.log('\n=== CHECKING FOR DOUBLE NEWLINES ===\n');
  console.log('Response type:', typeof result.response);
  console.log('Response length:', result.response.length);
  
  // Count newlines
  const doubleNewlines = (result.response.match(/\n\n/g) || []).length;
  const totalNewlines = (result.response.match(/\n/g) || []).length;
  
  console.log(`Total \\n characters: ${totalNewlines}`);
  console.log(`Double \\n\\n sequences: ${doubleNewlines}`);
  
  // Show first 500 chars with newlines visible
  const preview = result.response.substring(0, 500).replace(/\n/g, '\\n');
  console.log('\nFirst 500 chars (with \\n visible):');
  console.log(preview);
}

testNewlines().catch(console.error);
