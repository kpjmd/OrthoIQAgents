import { TriageAgent } from './src/agents/triage-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { MindMenderAgent } from './src/agents/mind-mender-agent.js';
import logger from './src/utils/logger.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Elbow Dislocation Contextual Response Fix\n'));
console.log(chalk.yellow('User Question: "17yo with elbow dislocation playing football last week with 5/10 elbow pain. No fractures on xray. I\'m nervous about returning to football. What is the best treatment?"\n'));

async function testElbowDislocationContextualResponse() {
  try {
    const userQuestion = "17yo with elbow dislocation playing football last week with 5/10 elbow pain. No fractures on xray. I'm nervous about returning to football. What is the best treatment?";

    // Create case data
    const caseData = {
      id: 'elbow_dislocation_test',
      rawQuery: userQuestion,
      enableDualTrack: true,
      age: 17,
      primaryComplaint: 'elbow dislocation',
      symptoms: ['elbow pain', 'elbow instability', 'nervous about returning to football'],
      affectedArea: 'elbow',
      location: 'elbow',
      bodyPart: 'elbow',
      urgency: 'routine',
      painLevel: 5,
      duration: '1 week',
      sport: 'football',
      injuryMechanism: 'dislocation',
      imaging: 'no fractures on xray',
      psychologicalConcerns: ['nervous about returning to football']
    };

    console.log(chalk.bold.blue('1. TRIAGE AGENT ASSESSMENT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const triageAgent = new TriageAgent();
    const triageResult = await triageAgent.triageCase(caseData);

    console.log(chalk.green('✓ Triage completed'));
    console.log('Urgency:', triageResult.urgencyLevel);

    // Validation: Check if elbow is mentioned and NOT foot/head
    const triageText = JSON.stringify(triageResult).toLowerCase();
    const mentionsElbow = triageText.includes('elbow');
    const mentionsFoot = triageText.includes('foot');
    const mentionsHead = triageText.includes('head');

    console.log(chalk[mentionsElbow ? 'green' : 'red'](`${mentionsElbow ? '✓' : '✗'} Elbow identified: ${mentionsElbow}`));
    console.log(chalk[!mentionsFoot ? 'green' : 'red'](`${!mentionsFoot ? '✓' : '✗'} No irrelevant "foot" mention: ${!mentionsFoot}`));
    console.log(chalk[!mentionsHead ? 'green' : 'red'](`${!mentionsHead ? '✓' : '✗'} No irrelevant "head" mention: ${!mentionsHead}`));

    console.log(chalk.bold.blue('\n2. MOVEMENT DETECTIVE ASSESSMENT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const movementAgent = new MovementDetectiveAgent();
    const movementResult = await movementAgent.analyzeMovementPattern(caseData);

    console.log(chalk.green('✓ Movement analysis completed'));

    // Validation: Check that Movement Detective focused on elbow
    const movementText = JSON.stringify(movementResult).toLowerCase();
    const movementMentionsElbow = movementText.includes('elbow');
    const movementMentionsFoot = movementText.includes('foot movement') || movementText.includes('foot analysis');
    const movementMentionsHeadPosture = movementText.includes('anterior_head_posture') || movementText.includes('head posture');

    console.log(chalk[movementMentionsElbow ? 'green' : 'red'](`${movementMentionsElbow ? '✓' : '✗'} Elbow-focused: ${movementMentionsElbow}`));
    console.log(chalk[!movementMentionsFoot ? 'green' : 'red'](`${!movementMentionsFoot ? '✓' : '✗'} No "Foot Movement Analysis": ${!movementMentionsFoot}`));
    console.log(chalk[!movementMentionsHeadPosture ? 'green' : 'red'](`${!movementMentionsHeadPosture ? '✓' : '✗'} No "anterior_head_posture": ${!movementMentionsHeadPosture}`));

    // Check for elbow-specific patterns
    const hasElbowPatterns = movementText.includes('instability') ||
                            movementText.includes('dislocation') ||
                            movementText.includes('ucl') ||
                            movementText.includes('elbow stiffness');
    console.log(chalk[hasElbowPatterns ? 'green' : 'yellow'](`${hasElbowPatterns ? '✓' : '⚠'} Elbow-specific patterns identified: ${hasElbowPatterns}`));

    // Show sample of response
    if (movementResult.rawResponse) {
      console.log(chalk.bold.cyan('\nMovement Detective Response (first 400 chars):'));
      console.log(chalk.white(movementResult.rawResponse.substring(0, 400) + '...'));
    }

    console.log(chalk.bold.blue('\n3. PAIN WHISPERER ASSESSMENT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const painAgent = new PainWhispererAgent();
    const painResult = await painAgent.assessPain(caseData);

    console.log(chalk.green('✓ Pain assessment completed'));
    console.log('Pain score:', painResult.painScore || 'Not extracted');

    const painText = JSON.stringify(painResult).toLowerCase();
    const painMentionsElbow = painText.includes('elbow');
    const painScoreValid = painResult.painScore !== null && painResult.painScore >= 0 && painResult.painScore <= 10;

    console.log(chalk[painMentionsElbow ? 'green' : 'red'](`${painMentionsElbow ? '✓' : '✗'} Elbow pain addressed: ${painMentionsElbow}`));
    console.log(chalk[painScoreValid ? 'green' : 'yellow'](`${painScoreValid ? '✓' : '⚠'} Valid pain score: ${painScoreValid} (${painResult.painScore}/10)`));

    console.log(chalk.bold.blue('\n4. STRENGTH SAGE ASSESSMENT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const strengthAgent = new StrengthSageAgent();
    const strengthResult = await strengthAgent.assessFunctionalCapacity(caseData);

    console.log(chalk.green('✓ Functional capacity assessment completed'));

    const strengthText = JSON.stringify(strengthResult).toLowerCase();
    const strengthMentionsElbow = strengthText.includes('elbow');
    const strengthMentionsFootball = strengthText.includes('football');
    const functionalCapacityValid = strengthResult.functionalCapacity !== 'null%' &&
                                    strengthResult.functionalCapacity !== null;

    console.log(chalk[strengthMentionsElbow ? 'green' : 'red'](`${strengthMentionsElbow ? '✓' : '✗'} Elbow-focused: ${strengthMentionsElbow}`));
    console.log(chalk[strengthMentionsFootball ? 'green' : 'yellow'](`${strengthMentionsFootball ? '✓' : '⚠'} Football-specific guidance: ${strengthMentionsFootball}`));
    console.log(chalk[functionalCapacityValid ? 'green' : 'red'](`${functionalCapacityValid ? '✓' : '✗'} Valid functional capacity (not "null%"): ${functionalCapacityValid}`));

    console.log(chalk.bold.blue('\n5. MIND MENDER ASSESSMENT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const mindAgent = new MindMenderAgent();
    const mindResult = await mindAgent.assessPsychologicalFactors(caseData);

    console.log(chalk.green('✓ Psychological assessment completed'));

    const mindText = JSON.stringify(mindResult).toLowerCase();
    const mindMentionsElbow = mindText.includes('elbow');
    const mindMentionsFootball = mindText.includes('football');
    const mindAddressesReturnFear = mindText.includes('return') && mindText.includes('nervous');

    console.log(chalk[mindMentionsElbow ? 'green' : 'red'](`${mindMentionsElbow ? '✓' : '✗'} Elbow injury context: ${mindMentionsElbow}`));
    console.log(chalk[mindMentionsFootball ? 'green' : 'yellow'](`${mindMentionsFootball ? '✓' : '⚠'} Football return addressed: ${mindMentionsFootball}`));
    console.log(chalk[mindAddressesReturnFear ? 'green' : 'yellow'](`${mindAddressesReturnFear ? '✓' : '⚠'} Nervousness about return addressed: ${mindAddressesReturnFear}`));

    console.log(chalk.bold.green('\n\n✅ FINAL VALIDATION SUMMARY\n'));
    console.log(chalk.gray('─'.repeat(60)));

    // Critical validations
    const allElbowFocused = mentionsElbow && movementMentionsElbow && painMentionsElbow && strengthMentionsElbow && mindMentionsElbow;
    const noIrrelevantBodyParts = !mentionsFoot && !movementMentionsFoot && !movementMentionsHeadPosture;
    const sportContextAddressed = strengthMentionsFootball && mindMentionsFootball;
    const functionalDataValid = functionalCapacityValid && painScoreValid;

    const allTestsPassed = allElbowFocused && noIrrelevantBodyParts && functionalDataValid;

    if (allTestsPassed) {
      console.log(chalk.green.bold('✅ ALL CRITICAL TESTS PASSED!'));
      console.log(chalk.green('  - All agents focused on elbow (not foot, not head)'));
      console.log(chalk.green('  - No irrelevant body parts mentioned'));
      console.log(chalk.green('  - Functional capacity data valid (not "null%")'));
      console.log(chalk.green('  - Pain score properly extracted'));
    } else {
      console.log(chalk.yellow.bold('⚠ SOME TESTS FAILED'));
      if (!allElbowFocused) console.log(chalk.red('  - Not all agents focused on elbow'));
      if (!noIrrelevantBodyParts) console.log(chalk.red('  - Irrelevant body parts mentioned (foot, head)'));
      if (!functionalDataValid) console.log(chalk.red('  - Functional capacity or pain score invalid'));
    }

    if (sportContextAddressed) {
      console.log(chalk.green('  ✓ Football-specific guidance provided'));
    } else {
      console.log(chalk.yellow('  ⚠ Football-specific guidance could be improved'));
    }

    console.log();

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    console.error(error.stack);
    process.exit(1);
  }
}

testElbowDislocationContextualResponse();
