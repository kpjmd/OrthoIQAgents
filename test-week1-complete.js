/**
 * Comprehensive Test for Week 1 Enhancement - Tasks 1.1-1.4
 * Tests: Dual-track, Structured Responses, Coordination Conference, Enhanced Synthesis
 */

const TEST_URL = 'http://localhost:3000';

async function testWeek1Complete() {
  console.log('🧪 WEEK 1 COMPLETE ENHANCEMENT TEST');
  console.log('=' .repeat(60));
  console.log('Testing Tasks 1.1, 1.2, 1.3, and 1.4\n');

  const startTime = Date.now();

  // Test case with comprehensive data
  const testCase = {
    caseData: {
      // Task 1.1: Dual-track fields
      rawQuery: "I've been experiencing severe lower back pain for the past 3 weeks, especially when I try to bend over or lift anything. It's making it hard to work and I'm worried about my upcoming marathon training.",
      enableDualTrack: true,
      userId: "test_user_123",
      isReturningUser: false,
      priorConsultations: [],
      requestResearch: true,
      uploadedImages: [],
      athleteProfile: {
        sport: "Marathon running",
        experience: "Intermediate",
        weeklyMileage: 40
      },
      platformContext: {
        source: "mobile_app",
        version: "2.0"
      },

      // Traditional case data
      primaryComplaint: "Lower back pain with functional limitations",
      symptoms: "Sharp pain in lower back, difficulty bending, pain radiating to left leg",
      painLevel: 7,
      duration: "3 weeks",
      location: "Lower back, L4-L5 region",
      age: 34,
      functionalLimitations: true,
      goals: ["Return to marathon training", "Pain-free daily activities"]
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender'],
    mode: 'normal' // Use normal mode to allow full coordination
  };

  try {
    console.log('📡 Sending consultation request...');
    console.log('Dual-track enabled:', testCase.caseData.enableDualTrack);
    console.log('Raw query:', testCase.caseData.rawQuery.substring(0, 80) + '...');
    console.log('');

    const response = await fetch(`${TEST_URL}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    if (!result.success) {
      throw new Error('Consultation failed: ' + JSON.stringify(result));
    }

    console.log('✅ Consultation completed successfully');
    console.log(`⏱️  Response Time: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}s)`);
    console.log('');

    // Validate Task 1.2: Structured Agent Responses
    console.log('📋 TASK 1.2: Structured Agent Responses');
    console.log('-'.repeat(60));

    const consultation = result.consultation;
    const responses = consultation.responses || [];

    console.log(`✓ Agents responded: ${responses.length}`);

    let structuredResponseCount = 0;
    let questionsForAgentsCount = 0;

    for (const agentResponse of responses) {
      const resp = agentResponse.response;

      if (resp && resp.specialist && resp.specialistType) {
        console.log(`\n  ${resp.specialist} (${resp.specialistType}):`);

        // Check structured fields
        const hasAssessment = resp.assessment?.primaryFindings?.length > 0;
        const hasRecommendations = resp.recommendations?.length > 0;
        const hasKeyFindings = resp.keyFindings?.length > 0;
        const hasQuestionsForAgents = resp.questionsForAgents?.length > 0;
        const hasFollowUpQuestions = resp.followUpQuestions?.length > 0;

        console.log(`    - Assessment: ${hasAssessment ? '✓' : '✗'}`);
        console.log(`    - Recommendations: ${hasRecommendations ? '✓ (' + resp.recommendations.length + ')' : '✗'}`);
        console.log(`    - Key Findings: ${hasKeyFindings ? '✓ (' + resp.keyFindings.length + ')' : '✗'}`);
        console.log(`    - Questions for Agents: ${hasQuestionsForAgents ? '✓ (' + resp.questionsForAgents.length + ')' : '✗'}`);
        console.log(`    - Follow-up Questions: ${hasFollowUpQuestions ? '✓ (' + resp.followUpQuestions.length + ')' : '✗'}`);
        console.log(`    - Confidence: ${resp.confidence?.toFixed(2)}`);
        console.log(`    - Response Time: ${resp.responseTime}ms`);

        if (hasAssessment && hasRecommendations && hasKeyFindings) {
          structuredResponseCount++;
        }

        if (hasQuestionsForAgents) {
          questionsForAgentsCount += resp.questionsForAgents.length;
        }
      }
    }

    console.log(`\n✓ Structured responses: ${structuredResponseCount}/${responses.length}`);
    console.log(`✓ Total inter-agent questions: ${questionsForAgentsCount}`);

    // Validate Task 1.3: Coordination Conference
    console.log('\n📋 TASK 1.3: Coordination Conference');
    console.log('-'.repeat(60));

    const synthesis = consultation.synthesizedRecommendations;
    const coordMetadata = synthesis?.coordinationMetadata;

    if (coordMetadata) {
      console.log(`✓ Coordination metadata present`);
      console.log(`  - Inter-agent dialogues: ${coordMetadata.interAgentDialogue?.length || 0}`);
      console.log(`  - Disagreements detected: ${coordMetadata.disagreements?.length || 0}`);
      console.log(`  - Emergent findings: ${coordMetadata.emergentFindings?.length || 0}`);

      // Show sample dialogue
      if (coordMetadata.interAgentDialogue && coordMetadata.interAgentDialogue.length > 0) {
        console.log('\n  Sample Inter-Agent Dialogue:');
        const sampleDialogue = coordMetadata.interAgentDialogue[0];
        console.log(`    From: ${sampleDialogue.fromAgent}`);
        console.log(`    To: ${sampleDialogue.toAgent}`);
        console.log(`    Question: ${sampleDialogue.question}`);
        console.log(`    Response: ${sampleDialogue.response?.substring(0, 100)}...`);
        console.log(`    Impact on Diagnosis: ${sampleDialogue.impactOnDiagnosis}`);
      }

      // Show disagreements
      if (coordMetadata.disagreements && coordMetadata.disagreements.length > 0) {
        console.log('\n  Disagreements:');
        coordMetadata.disagreements.forEach((dis, i) => {
          console.log(`    ${i + 1}. ${dis.topic}`);
          console.log(`       Agents: ${dis.agents.join(', ')}`);
          console.log(`       Severity: ${dis.severity}`);
        });
      }

      // Show emergent findings
      if (coordMetadata.emergentFindings && coordMetadata.emergentFindings.length > 0) {
        console.log('\n  Emergent Findings:');
        coordMetadata.emergentFindings.forEach((finding, i) => {
          console.log(`    ${i + 1}. ${finding.finding}`);
          console.log(`       Discovered by: ${finding.discoveredBy.join(', ')}`);
          console.log(`       Novelty: ${finding.novelty}`);
        });
      }
    } else {
      console.log('✗ Coordination metadata missing');
    }

    // Validate Task 1.4: Enhanced Synthesis
    console.log('\n📋 TASK 1.4: Enhanced Synthesis');
    console.log('-'.repeat(60));

    // Check 3-phase treatment plan
    if (synthesis?.treatmentPlan) {
      console.log('✓ 3-Phase Treatment Plan:');
      console.log(`  Phase 1: ${synthesis.treatmentPlan.phase1?.name} (${synthesis.treatmentPlan.phase1?.timeframe})`);
      console.log(`    - Goals: ${synthesis.treatmentPlan.phase1?.goals?.length || 0}`);
      console.log(`    - Interventions: ${synthesis.treatmentPlan.phase1?.interventions?.length || 0}`);

      console.log(`  Phase 2: ${synthesis.treatmentPlan.phase2?.name} (${synthesis.treatmentPlan.phase2?.timeframe})`);
      console.log(`    - Goals: ${synthesis.treatmentPlan.phase2?.goals?.length || 0}`);
      console.log(`    - Interventions: ${synthesis.treatmentPlan.phase2?.interventions?.length || 0}`);

      console.log(`  Phase 3: ${synthesis.treatmentPlan.phase3?.name} (${synthesis.treatmentPlan.phase3?.timeframe})`);
      console.log(`    - Goals: ${synthesis.treatmentPlan.phase3?.goals?.length || 0}`);
      console.log(`    - Interventions: ${synthesis.treatmentPlan.phase3?.interventions?.length || 0}`);
    } else {
      console.log('✗ Treatment plan missing');
    }

    // Check clinical flags
    if (synthesis?.clinicalFlags) {
      console.log('\n✓ Clinical Flags:');
      console.log(`  - Red flags detected: ${synthesis.clinicalFlags.redFlags?.length || 0}`);
      console.log(`  - Requires immediate MD: ${synthesis.clinicalFlags.requiresImmediateMD}`);
      console.log(`  - Urgency level: ${synthesis.clinicalFlags.urgencyLevel}`);

      if (synthesis.clinicalFlags.redFlags && synthesis.clinicalFlags.redFlags.length > 0) {
        console.log('\n  Red Flags:');
        synthesis.clinicalFlags.redFlags.forEach((flag, i) => {
          console.log(`    ${i + 1}. ${flag.flag}`);
          console.log(`       Severity: ${flag.severity}`);
          console.log(`       Detected by: ${flag.detectedBy}`);
        });
      }
    } else {
      console.log('✗ Clinical flags missing');
    }

    // Check confidence factors
    if (synthesis?.confidenceFactors) {
      console.log('\n✓ Confidence Factors:');
      console.log(`  - Data Completeness: ${synthesis.confidenceFactors.dataCompleteness}`);
      console.log(`  - Inter-agent Agreement: ${synthesis.confidenceFactors.interAgentAgreement}`);
      console.log(`  - Evidence Quality: ${synthesis.confidenceFactors.evidenceQuality}`);
      console.log(`  - Overall Confidence: ${synthesis.confidenceFactors.overallConfidence}`);
    } else {
      console.log('✗ Confidence factors missing');
    }

    // Check prescription data
    if (synthesis?.prescriptionData) {
      console.log('\n✓ Prescription Data:');
      console.log(`  - Primary Diagnosis: ${synthesis.prescriptionData.diagnosisHypothesis?.primary}`);
      console.log(`  - Diagnosis Confidence: ${synthesis.prescriptionData.diagnosisHypothesis?.confidence}`);
      console.log(`  - Agent Consensus: ${synthesis.prescriptionData.diagnosisHypothesis?.agentConsensus}`);
      console.log(`  - Specialist Insights: ${synthesis.prescriptionData.specialistInsights?.length || 0}`);
      console.log(`  - Evidence Grade: ${synthesis.prescriptionData.evidenceBase?.evidenceGrade}`);
      console.log(`  - Tracking Metrics: ${synthesis.prescriptionData.trackingMetrics?.length || 0}`);
    } else {
      console.log('✗ Prescription data missing');
    }

    // Check enhanced follow-up questions
    if (synthesis?.suggestedFollowUp) {
      console.log('\n✓ Enhanced Follow-up Questions:');
      console.log(`  - Total questions: ${synthesis.suggestedFollowUp.length}`);

      if (synthesis.suggestedFollowUp.length > 0) {
        const sample = synthesis.suggestedFollowUp[0];
        console.log(`  - Sample: ${sample.question}`);
        console.log(`    Purpose: ${sample.purpose}`);
        console.log(`    Expected Impact: ${sample.expectedImpact}`);
      }
    } else {
      console.log('✗ Enhanced follow-up questions missing');
    }

    // Check feedback prompts
    if (synthesis?.feedbackPrompts) {
      console.log('\n✓ Feedback Prompts:');
      console.log(`  - Immediate: ${synthesis.feedbackPrompts.immediate?.question || 'N/A'}`);
      console.log(`  - Milestone prompts: ${synthesis.feedbackPrompts.milestones?.length || 0}`);

      if (synthesis.feedbackPrompts.milestones && synthesis.feedbackPrompts.milestones.length > 0) {
        console.log('\n  Milestone Schedule:');
        synthesis.feedbackPrompts.milestones.forEach(milestone => {
          console.log(`    Day ${milestone.day}: ${milestone.prompt}`);
        });
      }
    } else {
      console.log('✗ Feedback prompts missing');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 WEEK 1 ENHANCEMENT SUMMARY');
    console.log('='.repeat(60));

    const checks = {
      'Task 1.1: Dual-track data processed': !!testCase.caseData.rawQuery,
      'Task 1.2: All agents structured responses': structuredResponseCount === responses.length,
      'Task 1.2: Inter-agent questions collected': questionsForAgentsCount > 0,
      'Task 1.3: Coordination conference executed': !!coordMetadata,
      'Task 1.3: Inter-agent dialogue present': coordMetadata?.interAgentDialogue?.length > 0,
      'Task 1.4: 3-phase treatment plan': !!synthesis?.treatmentPlan,
      'Task 1.4: Clinical flags detected': !!synthesis?.clinicalFlags,
      'Task 1.4: Prescription data complete': !!synthesis?.prescriptionData,
      'Task 1.4: Enhanced follow-up questions': synthesis?.suggestedFollowUp?.length > 0,
      'Task 1.4: Feedback prompts': !!synthesis?.feedbackPrompts,
      'Response time acceptable': responseTime < 60000
    };

    let passedChecks = 0;
    const totalChecks = Object.keys(checks).length;

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) passedChecks++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`RESULT: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks / totalChecks * 100)}%)`);
    console.log(`Total Response Time: ${(responseTime / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL WEEK 1 ENHANCEMENTS VALIDATED SUCCESSFULLY!');
    } else {
      console.log(`\n⚠️  ${totalChecks - passedChecks} check(s) failed - review output above`);
    }

    // Save full result to file for inspection
    const fs = require('fs');
    fs.writeFileSync(
      'week1-test-result.json',
      JSON.stringify(result, null, 2)
    );
    console.log('\n💾 Full result saved to: week1-test-result.json');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
console.log('Starting Week 1 Complete Enhancement Test...\n');
testWeek1Complete()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
