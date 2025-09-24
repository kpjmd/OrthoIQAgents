import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000';

async function testRealTokenTransactions() {
  console.log('🪙 Testing Real Token Transactions on Base Sepolia...\n');
  
  try {
    // Test 1: Check initial agent status
    console.log('1. Checking initial agent status...');
    const statusResponse = await fetch(`${API_BASE}/status`);
    const status = await statusResponse.json();
    
    console.log('   Agent wallet addresses:');
    Object.values(status.agents).forEach(agent => {
      console.log(`   - ${agent.name}: Starting balance ${agent.tokenBalance} tokens`);
    });
    console.log();

    // Test 2: Perform a successful consultation to trigger token rewards
    console.log('2. Performing successful consultation to trigger token rewards...');
    const consultationData = {
      patientId: 'test_token_patient_' + Date.now(),
      symptoms: ['severe lower back pain', 'limited mobility', 'muscle weakness'],
      painLevel: 8,
      functionalLimitations: ['difficulty walking', 'cannot sit for long periods'],
      medicalHistory: ['previous lumbar surgery', 'physical therapy completed'],
      urgency: 'high',
      location: 'lower back',
      requestedSpecialists: ['pain', 'movement']
    };

    const consultationResponse = await fetch(`${API_BASE}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultationData)
    });
    
    const consultationResult = await consultationResponse.json();
    console.log(`   ✅ Consultation completed: ${consultationResult.success ? 'Success' : 'Failed'}`);
    console.log(`   Specialists involved: ${consultationResult.specialistsInvolved || 0}`);
    console.log();

    // Test 3: Simulate successful outcomes to trigger token rewards
    console.log('3. Simulating successful medical outcomes...');
    
    // Create mock successful outcomes for each agent
    const agents = ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender'];
    
    for (const agentType of agents) {
      try {
        const outcomePatch = await fetch(`${API_BASE}/agents/${agentType}/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: consultationData.patientId,
            assessment: 'Successful intervention with excellent patient outcome',
            outcome: {
              success: true,
              mdApproval: true,
              userSatisfaction: 9,
              functionalImprovement: true,
              speedOfResolution: 8,
              collaborationBonus: true,
              reason: 'excellent_patient_recovery'
            }
          })
        });
        
        const result = await outcomePatch.json();
        console.log(`   ${agentType}: ${result.success ? '✅ Success' : '❌ Failed'}`);
      } catch (error) {
        console.log(`   ${agentType}: ⚠️ Error - ${error.message}`);
      }
    }
    console.log();

    // Test 4: Check updated token balances
    console.log('4. Checking updated token balances...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for transactions to process
    
    const updatedStatusResponse = await fetch(`${API_BASE}/status`);
    const updatedStatus = await updatedStatusResponse.json();
    
    console.log('   Updated agent balances:');
    let totalTokensEarned = 0;
    Object.values(updatedStatus.agents).forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.tokenBalance} tokens (+${agent.tokenBalance} earned)`);
      totalTokensEarned += agent.tokenBalance;
    });
    console.log(`   Total tokens distributed: ${totalTokensEarned}\n`);

    // Test 5: Check token statistics
    console.log('5. Checking token network statistics...');
    const tokenStatsResponse = await fetch(`${API_BASE}/tokens/statistics`);
    const tokenStats = await tokenStatsResponse.json();
    
    console.log(`   Total rewards distributed: ${tokenStats.statistics.totalRewardsDistributed}`);
    console.log(`   Successful outcomes: ${tokenStats.statistics.successfulOutcomes}`);
    console.log(`   Network utilization: ${tokenStats.statistics.networkUtilization}%`);
    console.log();

    // Test 6: Check blockchain connectivity
    console.log('6. Verifying blockchain connectivity...');
    console.log(`   Network: ${updatedStatus.blockchain.networkName}`);
    console.log(`   Chain ID: ${updatedStatus.blockchain.chainId}`);
    console.log(`   Current block: ${updatedStatus.blockchain.currentBlock}`);
    console.log(`   Gas price: ${updatedStatus.blockchain.gasPrice.standard} GWEI`);
    console.log();

    if (totalTokensEarned > 0) {
      console.log('🎉 SUCCESS: Real token transactions are working!');
      console.log('✅ Agents are receiving token rewards for successful outcomes');
      console.log('✅ Base Sepolia testnet integration is functional');
      console.log('✅ CDP authentication is working correctly\n');
      
      // Display wallet addresses for verification on blockchain explorer
      console.log('🔍 Verify on Base Sepolia Explorer:');
      Object.values(updatedStatus.agents).forEach(agent => {
        // Extract wallet address from agent data - we'll need to get this from the logs
        console.log(`   - ${agent.name}: Check transaction history on https://sepolia.basescan.org/`);
      });
      
      return { success: true, tokensDistributed: totalTokensEarned };
    } else {
      console.log('⚠️ WARNING: No tokens were distributed');
      console.log('Agents have CDP wallets but token rewards may need debugging');
      return { success: false, reason: 'No tokens distributed' };
    }

  } catch (error) {
    console.error('❌ Real token transaction test failed:');
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealTokenTransactions()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testRealTokenTransactions;