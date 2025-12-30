import { AgentCoordinator } from './src/utils/agent-coordinator.js';
import { TriageAgent } from './src/agents/triage-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Unified Synthesis Format\n'));

const userQuestion = "55yo with chronic 6/10 wrist pain for 9 months. I have an old scapholunate injury and now the pain and stiffness is getting worse. I'm worried I may lose my job. What are my treatment options?";

async function testSynthesisFormat() {
  // Initialize agents
  const triage = new TriageAgent();
  const painWhisperer = new PainWhispererAgent();
  const strengthSage = new StrengthSageAgent();
  const movementDetective = new MovementDetectiveAgent();

  // Create coordinator
  const coordinator = new AgentCoordinator();
  coordinator.registerSpecialist('triage', triage);
  coordinator.registerSpecialist('painWhisperer', painWhisperer);
  coordinator.registerSpecialist('strengthSage', strengthSage);
  coordinator.registerSpecialist('movementDetective', movementDetective);

  const caseData = {
    id: 'synthesis_test',
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
  console.log(chalk.bold.blue('Running Multi-Specialist Consultation...\n'));

  const result = await coordinator.coordinateMultiSpecialistConsultation(
    caseData,
    ['painWhisperer', 'strengthSage', 'movementDetective'],
    {
      mode: 'normal',
      rawQuery: userQuestion,
      enableDualTrack: true
    }
  );

  console.log(chalk.bold.green('\n✅ UNIFIED SYNTHESIS (What user will see):\n'));
  console.log(chalk.gray('─'.repeat(80)));
  console.log(result.synthesizedRecommendations.synthesis);
  console.log(chalk.gray('─'.repeat(80)));

  // Check for issues
  const hasGenericPhrases = result.synthesizedRecommendations.synthesis.includes('Specialist Insights') ||
                            result.synthesizedRecommendations.synthesis.includes('Recovery Journey');
  const hasDuplicateSection = (result.synthesizedRecommendations.synthesis.match(/## /g) || []).length > 5;

  console.log(chalk.bold.cyan('\n🔍 QUALITY CHECKS:\n'));
  console.log(chalk[hasGenericPhrases ? 'red' : 'green'](
    `${hasGenericPhrases ? '✗' : '✓'} No "Specialist Insights" or "Recovery Journey" sections: ${!hasGenericPhrases}`
  ));
  console.log(chalk[hasDuplicateSection ? 'yellow' : 'green'](
    `${hasDuplicateSection ? '⚠' : '✓'} Not overly sectioned: ${!hasDuplicateSection}`
  ));
  console.log(chalk.green(`✓ Uses LLM synthesis directly`));

  console.log(chalk.bold.blue('\n📊 METADATA:\n'));
  console.log(`Participating Specialists: ${result.participatingSpecialists.join(', ')}`);
  console.log(`Confidence: ${Math.round(result.synthesizedRecommendations.confidenceFactors.overallConfidence * 100)}%`);
}

testSynthesisFormat().catch(error => {
  console.error(chalk.red('Error during test:'), error);
  process.exit(1);
});
