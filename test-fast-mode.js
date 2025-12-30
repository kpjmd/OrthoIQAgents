/**
 * Fast Mode Test - Validates fast mode response times and background coordination
 */

const TEST_URL = 'http://localhost:3000';

async function testFastMode() {
  console.log('🚀 FAST MODE TEST');
  console.log('=' .repeat(60));
  console.log('Testing fast mode with background coordination\n');

  const testCase = {
    caseData: {
      rawQuery: "I have lower back pain that's been bothering me for 2 weeks",
      enableDualTrack: true,
      primaryComplaint: "Lower back pain",
      symptoms: "Dull aching pain in lower back",
      painLevel: 6,
      duration: "2 weeks",
      location: "Lower back",
      age: 35
    },
    requiredSpecialists: ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender'],
    mode: 'fast'
  };

  try {
    console.log('📡 Sending fast mode consultation request...');
    const startTime = Date.now();

    const response = await fetch(`${TEST_URL}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    console.log('✅ Response received');
    console.log(`⏱️  Response Time: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}s)`);
    console.log('');

    // Validate fast mode response
    console.log('📋 FAST MODE VALIDATION');
    console.log('-'.repeat(60));

    const checks = {
      'Response received successfully': result.success === true,
      'Mode is fast': result.mode === 'fast',
      'Triage response present': !!result.triage,
      'Response time < 10s': responseTime < 10000, // Allow 10s for CI/testing
      'Status is processing': result.status === 'processing',
      'Consultation ID present': !!result.consultationId,
      'Triage has structured fields': !!(result.triage?.specialist && result.triage?.recommendations && result.triage?.keyFindings)
    };

    let passedChecks = 0;
    const totalChecks = Object.keys(checks).length;

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) passedChecks++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`RESULT: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks / totalChecks * 100)}%)`);
    console.log(`Response Time: ${(responseTime / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    if (passedChecks === totalChecks) {
      console.log('\n🎉 FAST MODE TEST PASSED!');
      console.log('✓ Triage returned in <10s');
      console.log('✓ Background coordination will continue');
      console.log('✓ Result will be cached for training');
    } else {
      console.log(`\n⚠️  ${totalChecks - passedChecks} check(s) failed`);
    }

    // Show triage summary
    if (result.triage) {
      console.log('\n📄 Triage Summary:');
      console.log(`  Specialist: ${result.triage.specialist || 'N/A'}`);
      console.log(`  Urgency: ${result.triage.urgencyLevel || 'N/A'}`);
      console.log(`  Recommendations: ${result.triage.recommendations?.length || 0}`);
      console.log(`  Key Findings: ${result.triage.keyFindings?.length || 0}`);
      console.log(`  Questions for Agents: ${result.triage.questionsForAgents?.length || 0}`);
      console.log(`  Confidence: ${result.triage.confidence?.toFixed(2) || 'N/A'}`);
    }

    // Test normal mode for comparison
    console.log('\n' + '='.repeat(60));
    console.log('📡 Testing NORMAL MODE for comparison...');

    testCase.mode = 'normal';
    const normalStartTime = Date.now();

    const normalResponse = await fetch(`${TEST_URL}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    const normalResult = await normalResponse.json();
    const normalResponseTime = Date.now() - normalStartTime;

    console.log('✅ Normal mode response received');
    console.log(`⏱️  Response Time: ${normalResponseTime}ms (${(normalResponseTime / 1000).toFixed(2)}s)`);
    console.log(`   Agents: ${normalResult.consultation?.responses?.length || 0}`);
    console.log(`   Has synthesis: ${!!normalResult.consultation?.synthesizedRecommendations}`);

    console.log('\n📊 MODE COMPARISON');
    console.log('-'.repeat(60));
    console.log(`Fast Mode:   ${(responseTime / 1000).toFixed(2)}s`);
    console.log(`Normal Mode: ${(normalResponseTime / 1000).toFixed(2)}s`);
    console.log(`Speedup:     ${(normalResponseTime / responseTime).toFixed(1)}x faster`);

    process.exit(passedChecks === totalChecks ? 0 : 1);

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
console.log('Starting Fast Mode Test...\n');
testFastMode()
  .then(() => {
    console.log('\n✅ Test completed');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
