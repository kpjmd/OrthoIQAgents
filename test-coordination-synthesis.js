import { TriageAgent } from './src/agents/triage-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { StrengthSageAgent } from './src/agents/strength-sage-agent.js';
import { AgentCoordinator } from './src/utils/agent-coordinator.js';
import logger from './src/utils/logger.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 Testing Full Coordination Synthesis with Contextual Responses\n'));
console.log(chalk.yellow('User Question: "What could be causing hip pain in a 34 year old?"\n'));

async function testCoordinationSynthesis() {
  try {
    const userQuestion = "What could be causing hip pain in a 34 year old?";

    // Create case data
    const caseData = {
      id: 'coordination_test',
      rawQuery: userQuestion,
      enableDualTrack: true,
      age: 34,
      primaryComplaint: 'hip pain',
      symptoms: ['hip pain'],
      affectedArea: 'hip',
      location: 'hip',
      bodyPart: 'hip',
      urgency: 'routine',
      painLevel: 5,
      duration: '2 weeks'
    };

    console.log(chalk.bold.blue('1. SETTING UP COORDINATION\n'));
    console.log(chalk.gray('─'.repeat(60)));

    // Create coordinator and register specialists
    const coordinator = new AgentCoordinator();

    const triageAgent = new TriageAgent();
    const movementAgent = new MovementDetectiveAgent();
    const painAgent = new PainWhispererAgent();
    const strengthAgent = new StrengthSageAgent();

    coordinator.registerSpecialist('triage', triageAgent);
    coordinator.registerSpecialist('movementDetective', movementAgent);
    coordinator.registerSpecialist('painWhisperer', painAgent);
    coordinator.registerSpecialist('strengthSage', strengthAgent);

    console.log(chalk.green('✓ Registered 4 specialist agents\n'));

    console.log(chalk.bold.blue('2. RUNNING MULTI-SPECIALIST CONSULTATION\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const requiredSpecialists = ['triage', 'movementDetective', 'painWhisperer', 'strengthSage'];

    const consultationResult = await coordinator.coordinateMultiSpecialistConsultation(
      caseData,
      requiredSpecialists,
      {
        mode: 'normal',
        rawQuery: userQuestion,
        enableDualTrack: true
      }
    );

    console.log(chalk.green(`✓ Consultation completed in ${consultationResult.duration}ms`));
    console.log(chalk.gray(`  Participating specialists: ${consultationResult.participatingSpecialists.join(', ')}\n`));

    console.log(chalk.bold.blue('3. VALIDATING CONTEXTUAL RESPONSES\n'));
    console.log(chalk.gray('─'.repeat(60)));

    let allContextual = true;
    let allHaveConfidence = true;

    consultationResult.responses.forEach(response => {
      const mentionsHip = JSON.stringify(response).toLowerCase().includes('hip');

      // Check for confidence at multiple levels (response.confidence or response.response.confidence)
      const confidence = response.confidence || response.response?.confidence;
      const hasConfidence = confidence !== undefined && confidence > 0;

      console.log(chalk[mentionsHip ? 'green' : 'red'](
        `${mentionsHip ? '✓' : '✗'} ${response.specialist}: Hip-focused = ${mentionsHip}, Confidence = ${confidence?.toFixed(2) || 'N/A'}`
      ));

      if (!mentionsHip) allContextual = false;
      if (!hasConfidence) allHaveConfidence = false;
    });

    console.log();

    console.log(chalk.bold.blue('4. VALIDATING SYNTHESIS STRUCTURE\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const synthesis = consultationResult.synthesizedRecommendations;

    // Check if synthesis has the direct answer section
    const hasDirectAnswer = synthesis.synthesis.includes('Answering Your Question');
    console.log(chalk[hasDirectAnswer ? 'green' : 'red'](
      `${hasDirectAnswer ? '✓' : '✗'} Synthesis includes "Answering Your Question" section: ${hasDirectAnswer}`
    ));

    // Check if original query appears in synthesis
    const includesQuery = synthesis.synthesis.includes(userQuestion);
    console.log(chalk[includesQuery ? 'green' : 'red'](
      `${includesQuery ? '✓' : '✗'} Synthesis includes original query: ${includesQuery}`
    ));

    // Check if synthesis mentions hip
    const synthesisHipFocused = synthesis.synthesis.toLowerCase().includes('hip');
    console.log(chalk[synthesisHipFocused ? 'green' : 'red'](
      `${synthesisHipFocused ? '✓' : '✗'} Synthesis is hip-focused: ${synthesisHipFocused}`
    ));

    // Check if treatment plan is present
    const hasTreatmentPlan = synthesis.treatmentPlan && synthesis.treatmentPlan.phase1;
    console.log(chalk[hasTreatmentPlan ? 'green' : 'red'](
      `${hasTreatmentPlan ? '✓' : '✗'} 3-phase treatment plan present: ${hasTreatmentPlan}`
    ));

    // Check confidence factors
    const hasConfidenceFactors = synthesis.confidenceFactors && synthesis.confidenceFactors.overallConfidence !== undefined;
    console.log(chalk[hasConfidenceFactors ? 'green' : 'red'](
      `${hasConfidenceFactors ? '✓' : '✗'} Confidence factors calculated: ${hasConfidenceFactors}`
    ));

    if (hasConfidenceFactors) {
      console.log(chalk.gray(`  Overall confidence: ${Math.round(synthesis.confidenceFactors.overallConfidence * 100)}%`));
      console.log(chalk.gray(`  Inter-agent agreement: ${Math.round(synthesis.confidenceFactors.interAgentAgreement * 100)}%`));
    }

    console.log();

    console.log(chalk.bold.blue('5. SAMPLE SYNTHESIS OUTPUT\n'));
    console.log(chalk.gray('─'.repeat(60)));

    // Display first 800 characters of synthesis
    const synthesisPreview = synthesis.synthesis.substring(0, 800);
    console.log(chalk.white(synthesisPreview));
    if (synthesis.synthesis.length > 800) {
      console.log(chalk.gray(`\n... (${synthesis.synthesis.length - 800} more characters)\n`));
    }

    console.log(chalk.bold.green('\n\n✅ FINAL SUMMARY\n'));
    console.log(chalk.gray('─'.repeat(60)));

    const allTestsPassed = allContextual && allHaveConfidence && hasDirectAnswer && includesQuery && synthesisHipFocused && hasTreatmentPlan && hasConfidenceFactors;

    if (allTestsPassed) {
      console.log(chalk.green.bold('✓ ALL TESTS PASSED!'));
      console.log(chalk.green('  - All agents provided hip-focused responses'));
      console.log(chalk.green('  - All agents returned confidence scores'));
      console.log(chalk.green('  - Synthesis directly addresses user question'));
      console.log(chalk.green('  - Original query included in synthesis'));
      console.log(chalk.green('  - Complete treatment plan generated'));
      console.log(chalk.green('  - Confidence factors calculated'));
    } else {
      console.log(chalk.yellow.bold('⚠ SOME TESTS FAILED'));
      if (!allContextual) console.log(chalk.red('  - Not all agents focused on hip'));
      if (!allHaveConfidence) console.log(chalk.red('  - Not all agents returned confidence'));
      if (!hasDirectAnswer) console.log(chalk.red('  - Synthesis missing direct answer section'));
      if (!includesQuery) console.log(chalk.red('  - Synthesis missing original query'));
      if (!synthesisHipFocused) console.log(chalk.red('  - Synthesis not hip-focused'));
      if (!hasTreatmentPlan) console.log(chalk.red('  - Treatment plan incomplete'));
      if (!hasConfidenceFactors) console.log(chalk.red('  - Confidence factors missing'));
    }

    console.log();

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    console.error(error.stack);
    process.exit(1);
  }
}

testCoordinationSynthesis();
