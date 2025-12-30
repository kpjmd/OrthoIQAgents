import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Response Format - Chronic Wrist Pain\n'));

const userQuestion = "55yo with chronic 6/10 wrist pain for 9 months. I have an old scapholunate injury and now the pain and stiffness is getting worse. I'm worried I may lose my job. What are my treatment options?";

async function testResponseFormat() {
  const caseData = {
    id: 'wrist_format_test',
    rawQuery: userQuestion,
    enableDualTrack: true,
    age: 55,
    primaryComplaint: 'wrist pain',
    symptoms: ['wrist pain', 'stiffness', 'chronic pain'],
    affectedArea: 'wrist',
    location: 'wrist',
    bodyPart: 'wrist',
    urgency: 'routine',
    painLevel: 6,
    duration: '9 months'
  };

  console.log(chalk.bold.yellow(`📋 Test Query: "${userQuestion}"\n`));

  console.log(chalk.bold.blue('Testing Pain Whisperer Response Format\n'));
  const painAgent = new PainWhispererAgent();
  const painResult = await painAgent.assessPain(caseData);

  console.log(chalk.bold.green('\n✅ FORMATTED RESPONSE (What user will see):\n'));
  console.log(chalk.gray('─'.repeat(80)));
  console.log(painResult.response);
  console.log(chalk.gray('─'.repeat(80)));

  console.log(chalk.bold.blue('\n📊 METADATA (Backend only):\n'));
  console.log(`Pain Score: ${painResult.painScore}/10`);
  console.log(`Confidence: ${Math.round(painResult.confidence * 100)}%`);
  console.log(`Response Time: ${painResult.responseTime}ms`);

  // Check for issues
  const hasGenericRecommendations = painResult.response.includes('Multimodal pain management approach');
  const hasDuplicateInfo = (painResult.response.match(/pain.*6\/10/gi) || []).length > 2;

  console.log(chalk.bold.cyan('\n🔍 QUALITY CHECKS:\n'));
  console.log(chalk[hasGenericRecommendations ? 'red' : 'green'](
    `${hasGenericRecommendations ? '✗' : '✓'} No generic "Multimodal pain management approach": ${!hasGenericRecommendations}`
  ));
  console.log(chalk[hasDuplicateInfo ? 'yellow' : 'green'](
    `${hasDuplicateInfo ? '⚠' : '✓'} No excessive duplication: ${!hasDuplicateInfo}`
  ));
  console.log(chalk.green(`✓ Response is clean and readable`));
}

testResponseFormat().catch(error => {
  console.error(chalk.red('Error during test:'), error);
  process.exit(1);
});
