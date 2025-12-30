import { TriageAgent } from './src/agents/triage-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MindMenderAgent } from './src/agents/mind-mender-agent.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Specialist Depth Enhancement - Knee Twist Injury with Fear\n'));

const userQuestion = "37yo with 6/10 knee pain and swelling that goes up and down. I twisted my knee awkwardly 3 weeks ago on wet floor and it was very swollen. I'm scared to go down the stairs, what should I do now?";

async function testSpecialistDepth() {
  const caseData = {
    id: 'knee_twist_depth_test',
    rawQuery: userQuestion,
    enableDualTrack: true,
    age: 37,
    primaryComplaint: 'knee pain',
    symptoms: ['knee pain', 'swelling that fluctuates', 'fear of stairs'],
    affectedArea: 'knee',
    location: 'knee',
    bodyPart: 'knee',
    urgency: 'routine',
    painLevel: 6,  // Critical: Test pain score extraction fix
    duration: '3 weeks'
  };

  console.log(chalk.bold.yellow(`📋 Test Query: "${userQuestion}"\n`));

  console.log(chalk.bold.blue('1. MOVEMENT DETECTIVE - Testing Deep Biomechanics Reasoning\n'));
  const movementAgent = new MovementDetectiveAgent();
  const movementResult = await movementAgent.analyzeMovementPattern(caseData);

  // Validate deep reasoning
  const movementText = movementResult.rawResponse || '';
  const hasArthrokinematics = movementText.toLowerCase().includes('arthro') || movementText.toLowerCase().includes('gliding') || movementText.toLowerCase().includes('rolling');
  const hasKineticChain = movementText.toLowerCase().includes('kinetic chain') || movementText.toLowerCase().includes('proximal') || movementText.toLowerCase().includes('distal');
  const hasSpecificExercises = /\d+\s+(?:sets|reps|x\s*\d+|minutes|seconds)/i.test(movementText);
  const mentionsTwistMechanism = movementText.toLowerCase().includes('twist') || movementText.toLowerCase().includes('rotat');
  const mentionsPhase = movementText.toLowerCase().includes('proliferation') || movementText.toLowerCase().includes('3 week');

  console.log(chalk[hasArthrokinematics ? 'green' : 'red'](`${hasArthrokinematics ? '✓' : '✗'} Arthrokinematics reasoning: ${hasArthrokinematics}`));
  console.log(chalk[hasKineticChain ? 'green' : 'red'](`${hasKineticChain ? '✓' : '✗'} Kinetic chain analysis: ${hasKineticChain}`));
  console.log(chalk[hasSpecificExercises ? 'green' : 'red'](`${hasSpecificExercises ? '✓' : '✗'} Specific exercises (sets/reps): ${hasSpecificExercises}`));
  console.log(chalk[mentionsTwistMechanism ? 'green' : 'yellow'](`${mentionsTwistMechanism ? '✓' : '⚠'} Addresses twist mechanism: ${mentionsTwistMechanism}`));
  console.log(chalk[mentionsPhase ? 'green' : 'yellow'](`${mentionsPhase ? '✓' : '⚠'} Phase-aware (Early Proliferation): ${mentionsPhase}`));

  console.log(chalk.bold.blue('\n2. PAIN WHISPERER - Testing Pain Neuroscience Reasoning\n'));
  const painAgent = new PainWhispererAgent();
  const painResult = await painAgent.assessPain(caseData);

  // Validate pain score fix and deep reasoning
  const painScoreCorrect = painResult.painScore === 6;
  const painText = painResult.rawResponse || '';
  const hasNociceptive = painText.toLowerCase().includes('nocicept') || painText.toLowerCase().includes('sensitiz');
  const hasPainCycle = painText.toLowerCase().includes('pain-spasm') || painText.toLowerCase().includes('cycle');
  const hasSpecificProtocol = /ice.*\d+.*min|compress|elevat.*\d+/i.test(painText);
  const notGenericPain = !painText.toLowerCase().includes('multimodal pain management approach');

  console.log(chalk[painScoreCorrect ? 'green' : 'red'](`${painScoreCorrect ? '✓' : '✗'} Pain score correct (6/10): ${painResult.painScore}/10`));
  console.log(chalk[hasNociceptive ? 'green' : 'red'](`${hasNociceptive ? '✓' : '✗'} Nociceptive/sensitization reasoning: ${hasNociceptive}`));
  console.log(chalk[hasPainCycle ? 'green' : 'yellow'](`${hasPainCycle ? '✓' : '⚠'} Pain-spasm cycle discussion: ${hasPainCycle}`));
  console.log(chalk[hasSpecificProtocol ? 'green' : 'red'](`${hasSpecificProtocol ? '✓' : '✗'} Specific protocols (not generic): ${hasSpecificProtocol}`));
  console.log(chalk[notGenericPain ? 'green' : 'red'](`${notGenericPain ? '✓' : '✗'} Not generic "multimodal approach": ${notGenericPain}`));

  console.log(chalk.bold.blue('\n3. STRENGTH SAGE - Testing Neuromuscular Reasoning\n'));
  const strengthAgent = new StrengthSageAgent();
  const strengthResult = await strengthAgent.assessFunctionalCapacity(caseData);

  // Validate deep reasoning
  const strengthText = strengthResult.rawResponse || '';
  const hasAMI = strengthText.toLowerCase().includes('arthrogenic') || strengthText.toLowerCase().includes('inhibition') || strengthText.toLowerCase().includes('vmo');
  const hasSpecificStrengthening = /quad.*sets.*\d+.*\d+|straight leg raise.*\d+.*\d+|terminal.*extension/i.test(strengthText);
  const hasProgression = strengthText.toLowerCase().includes('progress when') || strengthText.toLowerCase().includes('advance when');
  const notGenericStrength = !strengthText.toLowerCase().includes('progressive strength training program');

  console.log(chalk[hasAMI ? 'green' : 'red'](`${hasAMI ? '✓' : '✗'} AMI/neuromuscular reasoning: ${hasAMI}`));
  console.log(chalk[hasSpecificStrengthening ? 'green' : 'red'](`${hasSpecificStrengthening ? '✓' : '✗'} Specific strengthening with sets/reps: ${hasSpecificStrengthening}`));
  console.log(chalk[hasProgression ? 'green' : 'yellow'](`${hasProgression ? '✓' : '⚠'} Objective progression criteria: ${hasProgression}`));
  console.log(chalk[notGenericStrength ? 'green' : 'red'](`${notGenericStrength ? '✓' : '✗'} Not generic "progressive strength training": ${notGenericStrength}`));

  console.log(chalk.bold.blue('\n4. MIND MENDER - Testing Psychological Expertise\n'));
  const mindAgent = new MindMenderAgent();
  const mindResult = await mindAgent.assessPsychologicalFactors(caseData);

  // Validate psychological reasoning
  const mindText = mindResult.rawResponse || '';
  const addressesFear = mindText.toLowerCase().includes('fear') || mindText.toLowerCase().includes('scared');
  const hasGradedExposure = mindText.toLowerCase().includes('graded exposure') || (mindText.toLowerCase().includes('phase') && mindText.toLowerCase().includes('stair'));
  const hasStairProtocol = mindText.toLowerCase().includes('stair') && /phase\s*\d+/i.test(mindText);
  const hasCopingStrategies = mindText.toLowerCase().includes('breathing') || mindText.toLowerCase().includes('visualization') || mindText.toLowerCase().includes('self-talk');

  console.log(chalk[addressesFear ? 'green' : 'red'](`${addressesFear ? '✓' : '✗'} Addresses fear of stairs: ${addressesFear}`));
  console.log(chalk[hasGradedExposure ? 'green' : 'red'](`${hasGradedExposure ? '✓' : '✗'} Graded exposure protocol: ${hasGradedExposure}`));
  console.log(chalk[hasStairProtocol ? 'green' : 'yellow'](`${hasStairProtocol ? '✓' : '⚠'} Specific stair protocol (phases): ${hasStairProtocol}`));
  console.log(chalk[hasCopingStrategies ? 'green' : 'yellow'](`${hasCopingStrategies ? '✓' : '⚠'} Specific coping strategies: ${hasCopingStrategies}`));

  console.log(chalk.bold.green('\n\n✅ SPECIALIST DEPTH VALIDATION\n'));
  const allPassed = hasArthrokinematics && hasKineticChain && hasSpecificExercises &&
                    painScoreCorrect && hasNociceptive && hasSpecificProtocol && notGenericPain &&
                    hasAMI && hasSpecificStrengthening && notGenericStrength &&
                    addressesFear && hasGradedExposure;

  if (allPassed) {
    console.log(chalk.green.bold('✅ ALL DEPTH TESTS PASSED!'));
    console.log(chalk.green('  - Movement Detective shows biomechanical reasoning'));
    console.log(chalk.green('  - Pain Whisperer shows pain neuroscience reasoning'));
    console.log(chalk.green('  - Strength Sage shows neuromuscular reasoning'));
    console.log(chalk.green('  - Mind Mender shows psychological expertise'));
    console.log(chalk.green('  - All agents provide SPECIFIC protocols (not generic)'));
  } else {
    console.log(chalk.yellow.bold('⚠ SOME DEPTH TESTS FAILED - Review agent responses'));
  }

  // Print summary excerpts
  console.log(chalk.bold.cyan('\n\n📄 RESPONSE EXCERPTS:\n'));

  console.log(chalk.bold('Movement Detective:'));
  console.log(chalk.gray(movementText.substring(0, 300) + '...\n'));

  console.log(chalk.bold('Pain Whisperer:'));
  console.log(chalk.gray(painText.substring(0, 300) + '...\n'));

  console.log(chalk.bold('Strength Sage:'));
  console.log(chalk.gray(strengthText.substring(0, 300) + '...\n'));

  console.log(chalk.bold('Mind Mender:'));
  console.log(chalk.gray(mindText.substring(0, 300) + '...\n'));
}

testSpecialistDepth().catch(error => {
  console.error(chalk.red('Error during test:'), error);
  process.exit(1);
});
