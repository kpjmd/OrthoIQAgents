/**
 * Milestone Feedback Test - Validates milestone check-in functionality
 * Tests progress tracking, token distribution, and reassessment triggering
 */

const TEST_URL = 'http://localhost:3000';

async function testMilestoneFeedback() {
  console.log('🎯 MILESTONE FEEDBACK TEST');
  console.log('=' .repeat(60));
  console.log('Testing milestone check-in with progress tracking and token rewards\n');

  try {
    // Step 1: Create initial consultation
    console.log('📡 Step 1: Creating initial consultation...');

    const initialConsultation = {
      caseData: {
        rawQuery: "I injured my shoulder playing basketball 3 days ago. Sharp pain when lifting my arm.",
        enableDualTrack: true,
        primaryComplaint: "Acute shoulder injury",
        symptoms: "Sharp pain, limited range of motion, difficulty sleeping",
        painLevel: 8,
        duration: "3 days",
        location: "Right shoulder",
        age: 28,
        functionalLimitations: true,
        goals: ["Return to basketball", "Full pain-free range of motion"]
      },
      requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender'],
      mode: 'normal'
    };

    const consultationResponse = await fetch(`${TEST_URL}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialConsultation)
    });

    const consultationResult = await consultationResponse.json();
    console.log(`✅ Initial consultation created: ${consultationResult.consultation?.consultationId || 'N/A'}`);
    console.log(`   Agents responded: ${consultationResult.consultation?.responses?.length || 0}`);
    console.log('');

    // Use a mock consultation ID for testing (since we may not have caching implemented)
    const consultationId = consultationResult.consultation?.consultationId || `consultation_${Date.now()}`;
    const patientId = "test_patient_milestone_001";

    // Step 2: Test Day 7 Milestone - Good Progress
    console.log('📊 Step 2: Testing Day 7 Milestone - Good Progress...');

    const day7Milestone = {
      consultationId,
      patientId,
      milestoneDay: 7,
      progressData: {
        painLevel: 5,           // Down from 8 (38% reduction)
        functionalScore: 60,    // Up from baseline ~50
        adherence: 0.85,        // 85% adherence
        completedInterventions: ["ice", "rest", "gentle ROM exercises", "pain medication"],
        newSymptoms: [],
        concernFlags: []
      },
      patientReportedOutcome: {
        overallProgress: "improving",
        satisfactionSoFar: 7,
        difficultiesEncountered: ["Hard to remember exercises 3x daily"]
      }
    };

    const day7Response = await fetch(`${TEST_URL}/feedback/milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(day7Milestone)
    });

    const day7Result = await day7Response.json();
    console.log('Day 7 Full Response:', JSON.stringify(day7Result, null, 2));

    console.log('✅ Day 7 Milestone Response:');
    console.log(`   Milestone Achieved: ${day7Result.milestoneAchieved}`);
    console.log(`   Progress Status: ${day7Result.progressStatus}`);
    console.log(`   Progress Percentage: ${day7Result.progressPercentage}%`);
    if (day7Result.tokenReward) {
      console.log(`   Token Reward: ${day7Result.tokenReward.amount} tokens`);
      console.log(`   Reward Reason: ${day7Result.tokenReward.reason}`);
    }
    console.log(`   Reassessment Triggered: ${day7Result.reassessmentTriggered}`);
    console.log(`   Adjusted Recommendations: ${day7Result.adjustedRecommendations?.length || 0}`);
    if (day7Result.nextMilestone) {
      console.log(`   Next Milestone: Day ${day7Result.nextMilestone.day} (in ${day7Result.nextMilestone.daysUntilNext} days)`);
    }
    console.log(`   Encouragement: ${day7Result.encouragement}`);
    console.log('');

    // Step 3: Test Day 14 Milestone - Concerning Progress
    console.log('⚠️  Step 3: Testing Day 14 Milestone - Concerning Progress...');

    const day14Milestone = {
      consultationId,
      patientId,
      milestoneDay: 14,
      progressData: {
        painLevel: 7,           // Still high! (Only 12.5% reduction)
        functionalScore: 55,    // Minimal improvement
        adherence: 0.55,        // Poor adherence (55%)
        completedInterventions: ["occasional ice", "pain medication"],
        newSymptoms: ["Pain worse at night"],
        concernFlags: ["pain_worse_at_night", "limited_progress"]
      },
      patientReportedOutcome: {
        overallProgress: "stable",  // Not improving
        satisfactionSoFar: 4,
        difficultiesEncountered: ["Too busy for PT", "Exercises hurt too much", "No improvement seen"]
      }
    };

    const day14Response = await fetch(`${TEST_URL}/feedback/milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(day14Milestone)
    });

    const day14Result = await day14Response.json();

    console.log('✅ Day 14 Milestone Response (Concerning):');
    console.log(`   Milestone Achieved: ${day14Result.milestoneAchieved}`);
    console.log(`   Progress Status: ${day14Result.progressStatus}`);
    console.log(`   Progress Percentage: ${day14Result.progressPercentage}%`);
    console.log(`   Token Reward: ${day14Result.tokenReward ? day14Result.tokenReward.amount + ' tokens' : 'None (milestone not achieved)'}`);
    console.log(`   Reassessment Triggered: ${day14Result.reassessmentTriggered}`);
    if (day14Result.reassessmentTriggered) {
      console.log(`   Reassessment Reason: ${day14Result.reassessmentReason}`);
    }
    console.log(`   Adjusted Recommendations: ${day14Result.adjustedRecommendations?.length || 0}`);
    if (day14Result.adjustedRecommendations && day14Result.adjustedRecommendations.length > 0) {
      console.log('\n   Top Recommendations:');
      day14Result.adjustedRecommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`     ${i + 1}. [${rec.priority}] ${rec.recommendation}`);
        console.log(`        Rationale: ${rec.rationale}`);
      });
    }
    console.log(`\n   Encouragement: ${day14Result.encouragement}`);
    console.log('');

    // Step 4: Test Day 21 Milestone - Excellent Progress
    console.log('🌟 Step 4: Testing Day 21 Milestone - Excellent Progress...');

    const day21Milestone = {
      consultationId,
      patientId,
      milestoneDay: 21,
      progressData: {
        painLevel: 2,           // Excellent reduction! (75% from baseline)
        functionalScore: 85,    // Great functional improvement
        adherence: 0.95,        // Excellent adherence (95%)
        completedInterventions: ["all PT exercises", "progressive strengthening", "gradual return to activity", "proper sleep posture"],
        newSymptoms: [],
        concernFlags: []
      },
      patientReportedOutcome: {
        overallProgress: "improving",
        satisfactionSoFar: 9,
        difficultiesEncountered: []
      }
    };

    const day21Response = await fetch(`${TEST_URL}/feedback/milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(day21Milestone)
    });

    const day21Result = await day21Response.json();

    console.log('✅ Day 21 Milestone Response (Excellent):');
    console.log(`   Milestone Achieved: ${day21Result.milestoneAchieved}`);
    console.log(`   Progress Status: ${day21Result.progressStatus}`);
    console.log(`   Progress Percentage: ${day21Result.progressPercentage}%`);
    if (day21Result.tokenReward) {
      console.log(`   Token Reward: ${day21Result.tokenReward.amount} tokens`);
      console.log(`   Progress Level: ${day21Result.tokenReward.progressLevel}`);
      console.log(`   Adherence Bonus: ${day21Result.tokenReward.adherenceBonus}`);
    }
    console.log(`   Reassessment Triggered: ${day21Result.reassessmentTriggered}`);
    console.log(`   Next Milestone: Day ${day21Result.nextMilestone?.day || 'N/A'}`);
    console.log(`   Encouragement: ${day21Result.encouragement}`);
    console.log('');

    // Validation
    console.log('=' .repeat(60));
    console.log('📋 VALIDATION CHECKS');
    console.log('=' .repeat(60));

    const checks = {
      'Day 7: Good progress detected': day7Result.progressStatus === 'on_track',
      'Day 7: Milestone achieved': day7Result.milestoneAchieved === true,
      'Day 7: Tokens awarded': !!day7Result.tokenReward,
      'Day 7: No reassessment needed': day7Result.reassessmentTriggered === false,
      'Day 7: Has encouragement': !!day7Result.encouragement,
      'Day 7: Has next milestone': !!day7Result.nextMilestone,

      'Day 14: Concerning status detected': day14Result.progressStatus === 'concerning' || day14Result.progressStatus === 'needs_attention',
      'Day 14: Milestone not achieved': day14Result.milestoneAchieved === false,
      'Day 14: Reassessment triggered': day14Result.reassessmentTriggered === true,
      'Day 14: Has adjusted recommendations': day14Result.adjustedRecommendations?.length > 0,
      'Day 14: Adherence issues identified': day14Result.adjustedRecommendations?.some(r => r.category === 'adherence'),

      'Day 21: Excellent progress detected': day21Result.progressStatus === 'on_track' && day21Result.progressPercentage > 100,
      'Day 21: High token reward': day21Result.tokenReward?.amount >= 80,
      'Day 21: Adherence bonus awarded': day21Result.tokenReward?.adherenceBonus === true,
      'Day 21: No reassessment needed': day21Result.reassessmentTriggered === false
    };

    let passedChecks = 0;
    const totalChecks = Object.keys(checks).length;

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) passedChecks++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`RESULT: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks / totalChecks * 100)}%)`);
    console.log('='.repeat(60));

    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL MILESTONE FEEDBACK TESTS PASSED!');
      console.log('✓ Progress tracking working correctly');
      console.log('✓ Token rewards distributed appropriately');
      console.log('✓ Reassessment triggered when needed');
      console.log('✓ Adjusted recommendations generated');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${totalChecks - passedChecks} check(s) failed - review output above`);
      process.exit(1);
    }

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
console.log('Starting Milestone Feedback Test...\n');
testMilestoneFeedback()
  .then(() => {
    console.log('\n✅ Test completed successfully');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
