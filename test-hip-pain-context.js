import { TriageAgent } from './src/agents/triage-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import logger from './src/utils/logger.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Hip Pain Context Response\n'));
console.log(chalk.yellow('Testing if agents properly respond to: "What could be causing hip pain in a 34 year old?"\n'));

async function testHipPainContext() {
  try {
    // Original user question
    const userQuestion = "What could be causing hip pain in a 34 year old?";

    // Create case data with both raw and structured format
    const caseData = {
      id: 'hip_pain_test',
      rawQuery: userQuestion,
      enableDualTrack: true,
      // Structured data that might be extracted
      age: 34,
      primaryComplaint: 'hip pain',
      symptoms: ['hip pain'],
      affectedArea: 'hip',
      location: 'hip',
      bodyPart: 'hip',
      urgency: 'routine',
      painLevel: 5 // Assumed moderate pain for testing
    };

    console.log(chalk.bold.blue('\n1. TRIAGE AGENT ASSESSMENT'));
    console.log(chalk.gray('─'.repeat(60)));

    const triageAgent = new TriageAgent();
    const triageResult = await triageAgent.triageCase(caseData);

    console.log(chalk.green('✓ Triage completed'));
    console.log('Primary findings:', triageResult.assessment?.primaryFindings?.slice(0, 2).join('\n  '));
    console.log('Urgency:', triageResult.urgencyLevel);

    // Check if triage properly identified hip as the focus area
    const triageFoundHip = JSON.stringify(triageResult).toLowerCase().includes('hip');
    console.log(chalk[triageFoundHip ? 'green' : 'red'](`${triageFoundHip ? '✓' : '✗'} Hip identified in triage: ${triageFoundHip}`));

    console.log(chalk.bold.blue('\n2. MOVEMENT DETECTIVE ASSESSMENT'));
    console.log(chalk.gray('─'.repeat(60)));

    const movementAgent = new MovementDetectiveAgent();
    const movementResult = await movementAgent.analyzeMovementPattern(caseData);

    console.log(chalk.green('✓ Movement analysis completed'));
    console.log('Primary findings:', movementResult.assessment?.primaryFindings?.slice(0, 2).join('\n  '));

    // Check if Movement Detective focused on hip
    const movementFoundHip = JSON.stringify(movementResult).toLowerCase().includes('hip');
    const mentionedHeadPosture = JSON.stringify(movementResult).toLowerCase().includes('head');
    console.log(chalk[movementFoundHip ? 'green' : 'red'](`${movementFoundHip ? '✓' : '✗'} Hip mentioned in analysis: ${movementFoundHip}`));
    console.log(chalk[!mentionedHeadPosture ? 'green' : 'yellow'](`${!mentionedHeadPosture ? '✓' : '⚠'} Avoided irrelevant head posture: ${!mentionedHeadPosture}`));

    // Check raw response for contextual answer
    if (movementResult.rawResponse) {
      const rawLower = movementResult.rawResponse.toLowerCase();
      const hasHipCauses = rawLower.includes('hip flexor') ||
                          rawLower.includes('hip abductor') ||
                          rawLower.includes('impingement') ||
                          rawLower.includes('hip joint') ||
                          rawLower.includes('pelvis');
      console.log(chalk[hasHipCauses ? 'green' : 'red'](`${hasHipCauses ? '✓' : '✗'} Provided hip-specific causes: ${hasHipCauses}`));
    }

    console.log(chalk.bold.blue('\n3. PAIN WHISPERER ASSESSMENT'));
    console.log(chalk.gray('─'.repeat(60)));

    const painAgent = new PainWhispererAgent();
    const painResult = await painAgent.assessPain(caseData);

    console.log(chalk.green('✓ Pain assessment completed'));
    console.log('Primary findings:', painResult.assessment?.primaryFindings?.slice(0, 2).join('\n  '));
    console.log('Pain score:', painResult.painScore || 'Not specified');

    // Check if Pain Whisperer focused on hip pain
    const painFoundHip = JSON.stringify(painResult).toLowerCase().includes('hip');
    const painScoreValid = painResult.painScore !== null && painResult.painScore >= 0 && painResult.painScore <= 10;
    console.log(chalk[painFoundHip ? 'green' : 'red'](`${painFoundHip ? '✓' : '✗'} Hip pain addressed: ${painFoundHip}`));
    console.log(chalk[painScoreValid ? 'green' : 'yellow'](`${painScoreValid ? '✓' : '⚠'} Valid pain score extracted: ${painScoreValid} (${painResult.painScore}/10)`));

    console.log(chalk.bold.green('\n\n✅ SUMMARY OF CONTEXTUAL RESPONSE TEST'));
    console.log(chalk.gray('─'.repeat(60)));

    const allTestsPassed = triageFoundHip && movementFoundHip && !mentionedHeadPosture && painFoundHip;

    console.log(chalk[allTestsPassed ? 'green' : 'yellow'].bold(
      allTestsPassed ?
      '✓ All agents successfully focused on hip-specific content!' :
      '⚠ Some agents still need improvement in contextual responses'
    ));

    console.log('\nKey improvements needed:');
    if (!triageFoundHip) console.log(chalk.red('- Triage needs to identify body part from query'));
    if (!movementFoundHip) console.log(chalk.red('- Movement Detective needs to focus on mentioned body part'));
    if (mentionedHeadPosture) console.log(chalk.yellow('- Movement Detective should avoid generic assessments'));
    if (!painFoundHip) console.log(chalk.red('- Pain Whisperer needs to address specific pain location'));
    if (!painScoreValid) console.log(chalk.yellow('- Pain Whisperer needs better pain score extraction'));

    // Display sample of actual responses for verification
    console.log(chalk.bold.cyan('\n\n📋 SAMPLE RESPONSES FOR VERIFICATION:'));
    console.log(chalk.gray('─'.repeat(60)));

    if (movementResult.rawResponse) {
      console.log(chalk.bold('\nMovement Detective Response (first 500 chars):'));
      console.log(chalk.gray(movementResult.rawResponse.substring(0, 500) + '...'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    console.error(error.stack);
  }
}

testHipPainContext();