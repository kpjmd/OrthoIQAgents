/**
 * Test script for prediction market and inter-agent token economy
 * Tests the newly implemented prediction market system
 */

import dotenv from 'dotenv';
import logger from './src/utils/logger.js';
import AgentCoordinator from './src/utils/agent-coordinator.js';
import TokenManager from './src/utils/token-manager.js';
import { TriageAgent } from './src/agents/triage-agent.js';
import { PainWhispererAgent } from './src/agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './src/agents/movement-detective-agent.js';

dotenv.config();

async function testPredictionMarket() {
  logger.info('=== Testing Prediction Market System ===');

  try {
    // Initialize token manager and coordinator
    const tokenManager = new TokenManager();
    const coordinator = new AgentCoordinator(tokenManager);

    // Create test agents
    const triageAgent = new TriageAgent();
    const painAgent = new PainWhispererAgent();
    const movementAgent = new MovementDetectiveAgent();

    // Wait for agents to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize agent wallets
    await tokenManager.initializeAgentWallet(triageAgent);
    await tokenManager.initializeAgentWallet(painAgent);
    await tokenManager.initializeAgentWallet(movementAgent);

    // Register agents with coordinator
    coordinator.registerSpecialist('triage', triageAgent);
    coordinator.registerSpecialist('painWhisperer', painAgent);
    coordinator.registerSpecialist('movementDetective', movementAgent);

    logger.info('Agents registered successfully');

    // Test case data
    const caseData = {
      primaryComplaint: 'knee pain after basketball injury',
      painLevel: 7,
      duration: 'acute',
      location: 'right knee',
      symptoms: 'swelling, limited range of motion, pain with weight bearing',
      onsetDescription: 'sudden onset during basketball game 3 days ago',
      aggravatingFactors: 'walking, stairs, bending',
      relievingFactors: 'rest, ice, elevation'
    };

    logger.info('Starting consultation with prediction market...');

    const startTime = Date.now();

    // Perform consultation (this will initiate predictions and payments)
    const consultation = await coordinator.coordinateMultiSpecialistConsultation(
      caseData,
      ['triage', 'painWhisperer', 'movementDetective'],
      { mode: 'normal' }
    );

    const duration = Date.now() - startTime;
    logger.info(`Consultation completed in ${duration}ms`);

    if (duration > 500) {
      logger.warn(`⚠️  Consultation overhead: ${duration}ms (target: <500ms)`);
    } else {
      logger.info(`✅ Performance target met: ${duration}ms < 500ms`);
    }

    logger.info(`Consultation ID: ${consultation.consultationId}`);
    logger.info(`Participating specialists: ${consultation.participatingSpecialists.join(', ')}`);

    // Check prediction market statistics
    logger.info('\n=== Prediction Market Statistics ===');
    const marketStats = coordinator.getPredictionMarketStats();

    if (marketStats) {
      logger.info(`Total consultations: ${marketStats.totalConsultations}`);
      logger.info(`Resolved consultations: ${marketStats.resolvedConsultations}`);
      logger.info(`Total predictions: ${marketStats.totalPredictions}`);
      logger.info(`Total staked: ${marketStats.totalStaked} tokens`);
      logger.info(`Average accuracy: ${Math.round(marketStats.averageMarketAccuracy * 100)}%`);

      if (marketStats.topPerformers && marketStats.topPerformers.length > 0) {
        logger.info('\nTop Performers:');
        marketStats.topPerformers.forEach((performer, i) => {
          logger.info(`  ${i + 1}. Agent ${performer.agentId.substring(0, 8)}... - ${performer.averageAccuracy}% accuracy`);
        });
      }
    } else {
      logger.warn('Prediction market not initialized');
    }

    // Check agent prediction performance
    logger.info('\n=== Agent Prediction Performance ===');
    const agents = [triageAgent, painAgent, movementAgent];

    for (const agent of agents) {
      const performance = coordinator.getAgentPredictionPerformance(agent.agentId);
      if (performance) {
        logger.info(`\n${agent.name}:`);
        logger.info(`  Total predictions: ${performance.totalPredictions}`);
        logger.info(`  Average accuracy: ${Math.round(performance.averageAccuracy * 100)}%`);
        logger.info(`  Total staked: ${performance.totalStaked} tokens`);
        logger.info(`  Net tokens: ${performance.totalWon - performance.totalLost}`);
      }
    }

    // Test MD review resolution
    logger.info('\n=== Testing MD Review Resolution ===');
    const mdReviewData = {
      approved: true,
      clinicalAccuracy: 0.85,
      timestamp: new Date().toISOString()
    };

    const mdResolution = await coordinator.resolveMDReviewPredictions(
      consultation.consultationId,
      mdReviewData
    );

    if (mdResolution) {
      logger.info('MD review resolution successful');
      logger.info(`Average accuracy after MD review: ${Math.round(mdResolution.agentResults.reduce((sum, r) => sum + r.accuracy, 0) / mdResolution.agentResults.length * 100)}%`);
    }

    // Test user modal resolution
    logger.info('\n=== Testing User Modal Resolution ===');
    const userFeedback = {
      satisfied: true,
      painLevel: 5, // Reduced from 7
      confidence: 4, // 1-5 scale
      timestamp: new Date().toISOString()
    };

    const userResolution = await coordinator.resolveUserModalPredictions(
      consultation.consultationId,
      userFeedback
    );

    if (userResolution) {
      logger.info('User modal resolution successful');
      logger.info(`Average accuracy after user feedback: ${Math.round(userResolution.agentResults.reduce((sum, r) => sum + r.accuracy, 0) / userResolution.agentResults.length * 100)}%`);
    }

    // Check token balances after all resolutions
    logger.info('\n=== Final Token Balances ===');
    for (const agent of agents) {
      const balance = tokenManager.getAgentBalance(agent.agentId);
      if (balance) {
        logger.info(`${agent.name}: ${balance.tokenBalance} tokens (earned: ${balance.totalEarned})`);
      }
    }

    // Network statistics
    logger.info('\n=== Token Network Statistics ===');
    const networkStats = tokenManager.getNetworkStatistics();
    logger.info(`Total tokens issued: ${networkStats.totalTokensIssued}`);
    logger.info(`Total rewards distributed: ${networkStats.totalRewardsDistributed}`);
    logger.info(`Network utilization: ${Math.round(networkStats.networkUtilization)}%`);

    logger.info('\n✅ Prediction market test completed successfully!');

    return {
      success: true,
      duration,
      consultation,
      marketStats,
      networkStats
    };
  } catch (error) {
    logger.error(`❌ Test failed: ${error.message}`);
    logger.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testPredictionMarket()
  .then(result => {
    if (result.success) {
      logger.info('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      logger.error('\n❌ Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
