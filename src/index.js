#!/usr/bin/env node

/**
 * OrthoIQ Agents - Main Entry Point
 * 
 * Multi-agent recovery ecosystem with token economics and blockchain integration
 */

import dotenv from 'dotenv';
import express from 'express';
import logger from './utils/logger.js';
import AgentCoordinator from './utils/agent-coordinator.js';
import TokenManager from './utils/token-manager.js';
import RecoveryMetrics from './utils/recovery-metrics.js';
import BlockchainUtils from './utils/blockchain-utils.js';
import CdpAccountManager from './utils/cdp-account-manager.js';
import cacheManager from './utils/cache-manager.js';
import promptManager from './utils/prompt-manager.js';
import { validateScope } from './utils/scope-validator.js';

// Import all specialist agents
import { TriageAgent } from './agents/triage-agent.js';
import { PainWhispererAgent } from './agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './agents/movement-detective-agent.js';
import { StrengthSageAgent } from './agents/strength-sage-agent.js';
import { MindMenderAgent } from './agents/mind-mender-agent.js';

// Load environment variables
dotenv.config();

// Helper function to check if consultation meets quality thresholds for MD review
function shouldFlagForMDReview(result) {
  // Check specialist count (3+, excluding triage)
  const specialistCount = result.participatingSpecialists
    ?.filter(specialist => specialist !== 'triage')
    .length || 0;
  if (specialistCount < 3) return { flag: false };

  // Calculate average confidence from responses
  const confidences = result.responses
    ?.filter(r => r.confidence != null)
    ?.map(r => r.confidence) || [];
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  // Check thresholds: confidence > 0.7 OR predicted accuracy > 0.85
  const meetsConfidenceThreshold = avgConfidence > 0.7;
  const predictedAccuracy = result.synthesizedRecommendations?.coordinationMetadata?.predictedAccuracy;
  const meetsPredictedAccuracy = predictedAccuracy > 0.85;

  // Debug logging
  logger.info(`MD Review check: specialists=${specialistCount}, avgConfidence=${avgConfidence.toFixed(2)}, predictedAccuracy=${predictedAccuracy?.toFixed(2) || 'N/A'}`);

  if (meetsConfidenceThreshold || meetsPredictedAccuracy) {
    return {
      flag: true,
      qualityScore: avgConfidence,
      specialistCount,
      reason: meetsConfidenceThreshold ? 'high_confidence' : 'high_predicted_accuracy'
    };
  }

  return { flag: false };
}

// API call to flag consultation for MD review (fails silently)
async function flagConsultationForMDReview(consultationId, qualityScore) {
  try {
    const response = await fetch(`http://localhost:3001/api/consultations/${consultationId}/flag-for-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requiresReview: true,
        qualityScore
      })
    });

    if (!response.ok) {
      logger.warn(`Failed to flag consultation ${consultationId} for MD review: ${response.status}`);
    } else {
      logger.info(`Consultation ${consultationId} flagged for MD review (quality: ${qualityScore.toFixed(2)})`);
    }
  } catch (error) {
    logger.error(`Error flagging consultation for MD review: ${error.message}`);
  }
}

class OrthoIQAgentSystem {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    // Core system components
    this.tokenManager = new TokenManager();
    this.coordinator = new AgentCoordinator(this.tokenManager); // Pass token manager for prediction market
    this.recoveryMetrics = new RecoveryMetrics();
    this.blockchainUtils = new BlockchainUtils();
    this.accountManager = new CdpAccountManager();

    // Agent registry
    this.agents = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing OrthoIQ Agent System');
      
      // Setup Express middleware
      this.setupMiddleware();
      
      // Initialize blockchain utilities
      await this.initializeBlockchain();
      
      // Initialize CDP account manager
      await this.initializeAccountManager();
      
      // Create and register agents
      await this.createAgents();
      
      // Initialize token economics
      await this.initializeTokenEconomics();
      
      // Setup API routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      logger.info('✅ OrthoIQ Agent System initialized successfully');
      
      return true;
    } catch (error) {
      logger.error(`❌ System initialization failed: ${error.message}`);
      return false;
    }
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  async initializeBlockchain() {
    try {
      logger.info('🔗 Initializing blockchain utilities');
      await this.blockchainUtils.initialize();
      logger.info('✅ Blockchain connection established');
    } catch (error) {
      logger.warn(`⚠️  Blockchain initialization failed, running in offline mode: ${error.message}`);
    }
  }

  async initializeAccountManager() {
    try {
      if (process.env.ENABLE_BLOCKCHAIN === 'true') {
        logger.info('🏦 Initializing CDP Account Manager');
        await this.accountManager.initialize();
        logger.info('✅ CDP Account Manager initialized');
      } else {
        logger.info('ℹ️  CDP Account Manager disabled (blockchain disabled)');
      }
    } catch (error) {
      logger.warn(`⚠️  CDP Account Manager initialization failed: ${error.message}`);
      // Set account manager to null so agents know not to use it
      this.accountManager = null;
    }
  }

  async createAgents() {
    try {
      logger.info('👥 Creating specialist agents');
      
      // Create all specialist agents - but wait for their initialization
      const triageAgent = new TriageAgent('OrthoTriage Master', this.accountManager);
      await this.waitForAgentInitialization(triageAgent);
      
      const painWhispererAgent = new PainWhispererAgent('Pain Whisperer', this.accountManager);
      await this.waitForAgentInitialization(painWhispererAgent);
      
      const movementDetectiveAgent = new MovementDetectiveAgent('Movement Detective', this.accountManager);
      await this.waitForAgentInitialization(movementDetectiveAgent);
      
      const strengthSageAgent = new StrengthSageAgent('Strength Sage', this.accountManager);
      await this.waitForAgentInitialization(strengthSageAgent);
      
      const mindMenderAgent = new MindMenderAgent('Mind Mender', this.accountManager);
      await this.waitForAgentInitialization(mindMenderAgent);
      
      this.agents = {
        triage: triageAgent,
        painWhisperer: painWhispererAgent,
        movementDetective: movementDetectiveAgent,
        strengthSage: strengthSageAgent,
        mindMender: mindMenderAgent
      };
      
      // Register agents with coordinator
      Object.entries(this.agents).forEach(([type, agent]) => {
        this.coordinator.registerSpecialist(type, agent);
        
        // Register with triage agent's specialist network
        if (type !== 'triage') {
          this.agents.triage.registerSpecialist(type, agent);
        }
        
        logger.info(`✓ ${agent.name} - ${agent.subspecialty}`);
      });
      
      logger.info('✅ All agents created and registered');
    } catch (error) {
      logger.error(`❌ Agent creation failed: ${error.message}`);
      throw error;
    }
  }
  
  async waitForAgentInitialization(agent, timeout = 30000) {
    const start = Date.now();
    
    while (!agent.walletAddress && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!agent.walletAddress) {
      logger.warn(`Agent ${agent.name} wallet initialization timed out after ${timeout}ms`);
    } else {
      logger.info(`Agent ${agent.name} wallet initialization completed: ${agent.walletAddress}`);
    }
  }

  async initializeTokenEconomics() {
    try {
      logger.info('💰 Initializing token economics');
      
      // Initialize wallets for all agents
      for (const [type, agent] of Object.entries(this.agents)) {
        await this.tokenManager.initializeAgentWallet(agent);
        logger.info(`✓ Wallet initialized for ${agent.name}`);
      }
      
      // Initialize token contract with first available wallet provider
      const firstAgent = Object.values(this.agents)[0];
      if (firstAgent && firstAgent.walletProvider) {
        const tokenContract = await this.tokenManager.initializeTokenContract(firstAgent.walletProvider);
        if (tokenContract) {
          logger.info(`✓ Token contract: ${tokenContract.tokenAddress}`);
        }
      }
      
      logger.info('✅ Token economics initialized');
    } catch (error) {
      logger.error(`❌ Token initialization failed: ${error.message}`);
      throw error;
    }
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        system: 'OrthoIQ Agents',
        agents: Object.keys(this.agents).length,
        blockchain: this.blockchainUtils ? 'connected' : 'offline'
      });
    });

    // System status endpoint with performance metrics
    this.app.get('/status', async (req, res) => {
      try {
        const coordinationStats = this.coordinator.getCoordinationStatistics();
        const networkStats = this.tokenManager.getNetworkStatistics();
        const recoveryStats = this.recoveryMetrics.getRecoveryStatistics();
        const blockchainStats = await this.blockchainUtils.getNetworkStatistics();
        const cacheStats = cacheManager.getStats();
        const promptStats = promptManager.getStats();

        res.json({
          system: {
            initialized: this.isInitialized,
            uptime: process.uptime(),
            version: '2.0.0', // Updated version with optimizations
            optimizationsEnabled: true
          },
          performance: {
            cache: cacheStats,
            prompts: promptStats,
            averageResponseTime: coordinationStats.averageDuration,
            mode: 'optimized'
          },
          agents: Object.fromEntries(
            Object.entries(this.agents).map(([type, agent]) => [
              type,
              {
                name: agent.name,
                experience: agent.experience,
                tokenBalance: agent.tokenBalance,
                specialization: agent.subspecialty
              }
            ])
          ),
          coordination: coordinationStats,
          tokenEconomics: networkStats,
          recovery: recoveryStats,
          blockchain: blockchainStats
        });
      } catch (error) {
        logger.error(`Error getting system status: ${error.message}`);
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    // Triage endpoint
    this.app.post('/triage', async (req, res) => {
      try {
        // Scope validation - early return if out of scope
        const scopeCheck = this.validateQueryScope(req, res);
        if (scopeCheck) return;

        const caseData = req.body;
        const triageResult = await this.agents.triage.triageCase(caseData);
        
        // Award tokens for successful triage
        await this.tokenManager.distributeTokenReward(this.agents.triage.agentId, {
          success: true,
          reason: 'api_triage'
        }, {
          walletProvider: this.agents.triage.walletProvider
        });

        res.json({
          success: true,
          triage: triageResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Triage API error: ${error.message}`);
        res.status(500).json({ error: 'Triage failed', message: error.message });
      }
    });

    // Multi-specialist consultation endpoint with caching and modes
    this.app.post('/consultation', async (req, res) => {
      try {
        // Scope validation - early return if out of scope
        const scopeCheck = this.validateQueryScope(req, res);
        if (scopeCheck) return;

        const {
          caseData,
          requiredSpecialists,
          mode = 'fast',
          platformContext
        } = req.body;
        const startTime = Date.now();

        // Extract new dual-track fields from caseData
        const {
          rawQuery,
          enableDualTrack,
          userId,
          isReturningUser,
          priorConsultations,
          requestResearch,
          uploadedImages,
          athleteProfile,
          ...traditionalCaseData
        } = caseData;

        // Check for noCache flag (query param or body param)
        const noCache = req.query.noCache === 'true' || req.body.noCache === true;
        const enableSimilarityCache = process.env.ENABLE_SIMILARITY_CACHE === 'true';

        // Check cache first (unless noCache is specified)
        if (!noCache && process.env.ENABLE_CACHE === 'true') {
          const cached = await cacheManager.get(caseData);
          if (cached) {
            logger.info(`Cache hit - returning cached consultation`);
            return res.json({
              success: true,
              consultation: cached.response,
              fromCache: true,
              responseTime: Date.now() - startTime,
              timestamp: new Date().toISOString()
            });
          }

          // Check for similar cases if similarity cache is enabled
          if (enableSimilarityCache) {
            const similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.8;
            const similar = await cacheManager.findSimilar(caseData, similarityThreshold);
            if (similar) {
              logger.info(`Similar case found - returning adapted consultation`);
              return res.json({
                success: true,
                consultation: similar,
                fromCache: true,
                similarityMatch: true,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            logger.debug('Similarity cache disabled - skipping similar case lookup');
          }
        } else if (noCache) {
          logger.info('Cache bypass requested via noCache flag');
        }
        
        // NEW: Triage-based smart routing
        const triageAssessment = await this.agents.triage.assessDataCompleteness(caseData);
        logger.info(`Data completeness: ${Math.round(triageAssessment.completeness * 100)}%, Confidence: ${Math.round(triageAssessment.confidence * 100)}%`);
        
        // Determine which specialists to involve based on data completeness
        let smartSpecialists;
        if (requiredSpecialists && requiredSpecialists.length > 0) {
          // If specific specialists requested, use them (honor explicit requests for testing/specific consultations)
          smartSpecialists = requiredSpecialists;
          logger.info(`Using explicitly requested specialists: ${smartSpecialists.join(', ')}`);
        } else if (triageAssessment.confidence > 0.7) {
          // High confidence - use triage recommendations
          smartSpecialists = triageAssessment.recommendedSpecialists;
        } else if (triageAssessment.minimumDataMet) {
          // Medium confidence - use limited specialists
          smartSpecialists = triageAssessment.recommendedSpecialists.slice(0, 3);
        } else {
          // Low confidence - triage only response
          logger.info('Data insufficient for multi-specialist consultation, using triage-only response');
          smartSpecialists = ['triage'];
        }
        
        logger.info(`Smart routing to specialists: ${smartSpecialists.join(', ')}`);

        // Fast mode: Return immediate triage response, continue full coordination in background
        if (mode === 'fast') {
          logger.info('Fast mode: Returning immediate triage, continuing coordination in background');

          // Get immediate triage-only response
          const triageAgent = this.agents.triage;
          const triageResponse = await triageAgent.triageCase(caseData, {
            rawQuery,
            enableDualTrack,
            userId,
            isReturningUser,
            platformContext
          });

          const consultationId = `consultation_${Date.now()}`;

          // Return immediately to user (target: <5s)
          res.json({
            success: true,
            mode: 'fast',
            triage: triageResponse,
            status: 'processing',
            message: 'Immediate triage assessment complete. Full multi-specialist consultation in progress.',
            consultationId,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });

          // Continue full coordination in background (fire-and-forget, no await)
          const backgroundPromise = this.coordinator.coordinateMultiSpecialistConsultation(
            caseData,
            smartSpecialists,
            {
              mode: 'normal', // Use normal mode for full coordination
              consultationId, // Pass the same ID to ensure consistency
              rawQuery,
              enableDualTrack,
              userId,
              isReturningUser,
              priorConsultations,
              requestResearch,
              uploadedImages,
              athleteProfile,
              platformContext
            }
          );

          // Handle background completion (no await - fire and forget)
          backgroundPromise
            .then(async result => {
              // Cache for training and future use
              await cacheManager.set(caseData, result);

              // Check if consultation meets quality thresholds for MD review
              const mdReviewCheck = shouldFlagForMDReview(result);
              if (mdReviewCheck.flag) {
                await flagConsultationForMDReview(consultationId, mdReviewCheck.qualityScore);
              }

              logger.info(`Background coordination complete for ${consultationId}, cached successfully`);
            })
            .catch(err => {
              logger.error(`Background coordination failed for ${consultationId}:`, err.message);
            });

          // Exit early - response already sent
          return;
        }

        // Normal mode: Complete multi-specialist consultation before responding
        // Set timeout for normal mode - 90s to accommodate parallel coordination + synthesis
        const timeout = 90000;
        const consultationPromise = this.coordinator.coordinateMultiSpecialistConsultation(
          caseData,
          smartSpecialists,
          {
            mode,
            rawQuery,
            enableDualTrack,
            userId,
            isReturningUser,
            priorConsultations,
            requestResearch,
            uploadedImages,
            athleteProfile,
            platformContext
          }
        );

        // Race against timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Consultation timeout')), timeout)
        );

        const consultationResult = await Promise.race([
          consultationPromise,
          timeoutPromise
        ]);
        
        // Enhance result with triage metadata
        consultationResult.dataCompleteness = triageAssessment.completeness;
        consultationResult.suggestedFollowUp = triageAssessment.suggestedFollowUp;
        consultationResult.triageConfidence = triageAssessment.confidence;
        consultationResult.specialistCoverage = this.agents.triage.getSpecialistCoverage(
          caseData, 
          consultationResult.participatingSpecialists
        );
        
        // Cache successful result
        await cacheManager.set(caseData, consultationResult);
        
        // Trigger learning mode in background if needed
        if (mode === 'fast' && promptManager.shouldRunLearningMode(caseData, consultationResult, this.agents.triage)) {
          setImmediate(() => {
            this.runLearningMode(caseData, consultationResult);
          });
        }
        
        res.json({
          success: true,
          consultation: consultationResult,
          fromCache: false,
          mode,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Consultation API error: ${error.message}`);
        
        // Return timeout error with appropriate status
        if (error.message.includes('timeout')) {
          res.status(504).json({ 
            error: 'Consultation timeout', 
            message: 'Request exceeded time limit, please try again',
            mode: req.body.mode
          });
        } else {
          res.status(500).json({ error: 'Consultation failed', message: error.message });
        }
      }
    });

    // Recovery tracking endpoints
    this.app.post('/recovery/start', async (req, res) => {
      try {
        const { patientId, initialAssessment } = req.body;
        
        const trackingResult = await this.recoveryMetrics.trackPatientRecovery(
          patientId,
          initialAssessment
        );

        res.json({
          success: true,
          tracking: trackingResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Recovery start API error: ${error.message}`);
        res.status(500).json({ error: 'Recovery tracking start failed', message: error.message });
      }
    });

    this.app.post('/recovery/update', async (req, res) => {
      try {
        const { patientId, progressData } = req.body;
        
        const updateResult = await this.recoveryMetrics.updateRecoveryProgress(
          patientId,
          progressData
        );

        // Award tokens for significant progress
        const metrics = updateResult.progressUpdate.metrics;
        if (metrics.painReduction >= 50 || metrics.functionalImprovement >= 70) {
          for (const agent of Object.values(this.agents)) {
            await this.tokenManager.distributeTokenReward(agent.agentId, {
              success: true,
              reason: 'progress_milestone',
              painReduction: metrics.painReduction || 0,
              functionalImprovement: metrics.functionalImprovement >= 70
            }, {
              walletProvider: agent.walletProvider
            });
          }
        }

        res.json({
          success: true,
          update: updateResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Recovery update API error: ${error.message}`);
        res.status(500).json({ error: 'Recovery update failed', message: error.message });
      }
    });

    this.app.post('/recovery/complete', async (req, res) => {
      try {
        const { patientId, finalOutcome } = req.body;
        
        const completionResult = await this.recoveryMetrics.completeRecoveryTracking(
          patientId,
          finalOutcome
        );

        // Record outcome on blockchain
        let blockchainRecord = null;
        if (await this.blockchainUtils.isConnected()) {
          blockchainRecord = await this.blockchainUtils.recordMedicalOutcome(
            patientId,
            finalOutcome,
            'recovery_team'
          );
        }

        // Distribute final rewards
        const outcome = {
          success: completionResult.success,
          mdApproval: true,
          userSatisfaction: finalOutcome.patientSatisfaction || 0,
          functionalImprovement: completionResult.finalMetrics.totalFunctionalImprovement >= 80,
          returnToActivity: finalOutcome.returnToActivity || false
        };

        const rewards = [];
        for (const agent of Object.values(this.agents)) {
          const reward = await this.tokenManager.distributeTokenReward(agent.agentId, outcome, {
            walletProvider: agent.walletProvider
          });
          rewards.push({ agent: agent.name, tokens: reward.amount });
        }

        res.json({
          success: true,
          completion: completionResult,
          blockchainRecord,
          rewards,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Recovery completion API error: ${error.message}`);
        res.status(500).json({ error: 'Recovery completion failed', message: error.message });
      }
    });

    // Agent-specific endpoints
    this.app.post('/agents/:agentType/assess', async (req, res) => {
      try {
        // Scope validation - early return if out of scope
        const scopeCheck = this.validateQueryScope(req, res);
        if (scopeCheck) return;

        const { agentType } = req.params;
        const assessmentData = req.body;

        const agent = this.agents[agentType];
        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        let result;
        switch (agentType) {
          case 'painWhisperer':
            result = await agent.assessPain(assessmentData);
            break;
          case 'movementDetective':
            result = await agent.analyzeMovementPattern(assessmentData);
            break;
          case 'strengthSage':
            result = await agent.assessFunctionalCapacity(assessmentData);
            break;
          case 'mindMender':
            result = await agent.assessPsychologicalFactors(assessmentData);
            break;
          default:
            result = await agent.processMessage(JSON.stringify(assessmentData));
        }

        // Process outcome for token rewards if outcome data is provided
        if (assessmentData.outcome && assessmentData.outcome.success) {
          try {
            await agent.updateExperienceWithTokens(assessmentData.outcome);
            logger.info(`Token rewards processed for ${agent.name} based on successful outcome`);
          } catch (tokenError) {
            logger.warn(`Token reward processing failed for ${agent.name}: ${tokenError.message}`);
          }
        }

        res.json({
          success: true,
          agent: agent.name,
          assessment: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Agent assessment API error: ${error.message}`);
        res.status(500).json({ error: 'Agent assessment failed', message: error.message });
      }
    });

    // Feedback endpoint for MD reviews and user satisfaction
    this.app.post('/feedback', async (req, res) => {
      try {
        const { consultationId, patientId, feedback } = req.body;
        
        if (!feedback) {
          return res.status(400).json({ error: 'Feedback data required' });
        }
        
        logger.info(`Processing feedback for consultation ${consultationId}`);
        
        // Store feedback for learning
        const feedbackResult = {
          consultationId,
          patientId,
          timestamp: new Date().toISOString(),
          userSatisfaction: feedback.userSatisfaction,
          outcomeSuccess: feedback.outcomeSuccess,
          mdReview: feedback.mdReview,
          followUpDataProvided: feedback.followUpDataProvided
        };
        
        // Process MD review for agent improvements
        if (feedback.mdReview) {
          await this.processMDReview(feedback.mdReview, consultationId);
        }
        
        // Distribute token rewards based on feedback
        if (feedback.userSatisfaction >= 8 || feedback.outcomeSuccess) {
          const rewardOutcome = {
            success: true,
            reason: 'positive_feedback',
            userSatisfaction: feedback.userSatisfaction,
            mdApproval: feedback.mdReview?.approved || false,
            learningContribution: !!feedback.followUpDataProvided
          };
          
          // Reward participating agents
          const rewardPromises = Object.values(this.agents).map(async (agent) => {
            // Check if agent participated in the consultation
            if (feedback.mdReview?.specialistAccuracy?.[agent.subspecialty.split(' ')[0].toLowerCase()]) {
              const accuracy = feedback.mdReview.specialistAccuracy[agent.subspecialty.split(' ')[0].toLowerCase()];
              rewardOutcome.accuracyBonus = accuracy > 0.8;
              
              const reward = await this.tokenManager.distributeTokenReward(
                agent.agentId,
                rewardOutcome,
                { walletProvider: agent.walletProvider }
              );
              
              return { agent: agent.name, reward: reward.amount, accuracy };
            }
            return null;
          });
          
          const rewards = (await Promise.all(rewardPromises)).filter(Boolean);
          feedbackResult.tokenRewards = rewards;
        }
        
        // Store feedback for future training
        await this.storeFeedbackForTraining(feedbackResult);
        
        // Update recovery metrics if patient ID provided
        if (patientId && feedback.outcomeSuccess !== undefined) {
          await this.recoveryMetrics.updatePatientOutcome(patientId, {
            feedbackReceived: true,
            satisfaction: feedback.userSatisfaction,
            outcomeSuccess: feedback.outcomeSuccess
          });
        }
        
        res.json({
          success: true,
          message: 'Feedback processed successfully',
          feedbackId: `feedback_${Date.now()}`,
          tokenRewards: feedbackResult.tokenRewards || [],
          timestamp: feedbackResult.timestamp
        });
      } catch (error) {
        logger.error(`Feedback API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to process feedback', message: error.message });
      }
    });

    // Milestone feedback endpoint - for continuous check-ins during recovery
    this.app.post('/feedback/milestone', async (req, res) => {
      try {
        const { consultationId, patientId, milestoneDay, progressData, patientReportedOutcome } = req.body;

        // Validate required fields
        if (!consultationId || !milestoneDay || !progressData) {
          return res.status(400).json({
            error: 'Missing required fields: consultationId, milestoneDay, progressData'
          });
        }

        logger.info(`Processing milestone feedback for consultation ${consultationId} - Day ${milestoneDay}`);

        // Retrieve original consultation to get expected milestones
        const originalConsultation = await this.getStoredConsultation(consultationId);
        if (!originalConsultation) {
          logger.warn(`Original consultation not found for ${consultationId}, proceeding with analysis`);
        }

        // Initialize recovery tracking if not exists
        let recoveryRecord = this.recoveryMetrics.patientRecords.get(patientId);
        if (!recoveryRecord && originalConsultation) {
          await this.recoveryMetrics.trackPatientRecovery(patientId, {
            condition: originalConsultation.caseData?.primaryComplaint || 'general',
            severity: 'moderate',
            painLevel: originalConsultation.caseData?.painLevel || 5,
            functionalScore: 50,
            age: originalConsultation.caseData?.age || 45
          });
          recoveryRecord = this.recoveryMetrics.patientRecords.get(patientId);
        }

        // Analyze progress vs expected
        const progressAnalysis = this.analyzeMilestoneProgress(
          milestoneDay,
          progressData,
          recoveryRecord,
          originalConsultation
        );

        // Determine if milestone achieved
        const milestoneAchieved = progressAnalysis.progressPercentage >= 80;
        const progressStatus = progressAnalysis.status; // 'on_track', 'needs_attention', 'concerning'

        // Update recovery metrics with progress data
        if (recoveryRecord) {
          await this.recoveryMetrics.updateRecoveryProgress(patientId, {
            painLevel: progressData.painLevel,
            functionalScore: progressData.functionalScore,
            adherence: progressData.adherence,
            completedInterventions: progressData.completedInterventions,
            newSymptoms: progressData.newSymptoms || [],
            concernFlags: progressData.concernFlags || []
          });
        }

        // Distribute token rewards for milestone achievement
        let tokenReward = null;
        if (milestoneAchieved) {
          const rewardAmount = this.calculateMilestoneReward(
            progressAnalysis.progressPercentage,
            progressData.adherence,
            milestoneDay
          );

          tokenReward = {
            amount: rewardAmount,
            reason: `Day ${milestoneDay} milestone achieved with ${Math.round(progressAnalysis.progressPercentage)}% progress`,
            adherenceBonus: progressData.adherence >= 0.9,
            progressLevel: progressAnalysis.progressLevel
          };

          // Distribute tokens to participating agents
          if (originalConsultation?.consultation?.responses) {
            const rewardPromises = originalConsultation.consultation.responses.map(async (agentResp) => {
              const agentName = agentResp.agent;
              const agent = Object.values(this.agents).find(a => a.name === agentName);

              if (agent) {
                try {
                  const reward = await this.tokenManager.distributeTokenReward(
                    agent.agentId,
                    {
                      success: true,
                      reason: 'milestone_achievement',
                      milestoneDay,
                      progressPercentage: progressAnalysis.progressPercentage,
                      adherence: progressData.adherence
                    },
                    { walletProvider: agent.walletProvider }
                  );

                  return { agent: agentName, reward: reward.amount };
                } catch (error) {
                  logger.error(`Token distribution failed for ${agentName}: ${error.message}`);
                  return null;
                }
              }
              return null;
            });

            const agentRewards = (await Promise.all(rewardPromises)).filter(Boolean);
            tokenReward.agentRewards = agentRewards;
          }
        }

        // Check if reassessment is needed
        const reassessmentNeeded = this.shouldTriggerReassessment(
          progressAnalysis,
          progressData,
          patientReportedOutcome,
          milestoneDay
        );

        let reassessmentTriggered = false;
        let reassessmentConsultation = null;

        if (reassessmentNeeded.required) {
          logger.info(`Triggering reassessment for ${consultationId}: ${reassessmentNeeded.reason}`);

          // Trigger new consultation with updated case data
          reassessmentConsultation = await this.triggerReassessment(
            originalConsultation,
            progressData,
            reassessmentNeeded.reason,
            patientId
          );

          reassessmentTriggered = true;
        }

        // Generate adjusted recommendations
        const adjustedRecommendations = this.generateAdjustedRecommendations(
          progressAnalysis,
          progressData,
          patientReportedOutcome,
          originalConsultation
        );

        // Determine next milestone
        const nextMilestone = this.getNextMilestone(milestoneDay, recoveryRecord);

        // Generate encouragement message
        const encouragement = this.generateEncouragementMessage(
          progressAnalysis,
          milestoneDay,
          progressData,
          patientReportedOutcome
        );

        // Store milestone feedback for learning
        const milestoneResult = {
          milestoneId: `milestone_${Date.now()}`,
          consultationId,
          patientId,
          milestoneDay,
          timestamp: new Date().toISOString(),
          progressData,
          patientReportedOutcome,
          progressAnalysis,
          milestoneAchieved,
          progressStatus,
          tokenReward,
          reassessmentTriggered,
          reassessmentReason: reassessmentNeeded.reason
        };

        await this.storeMilestoneFeedback(milestoneResult);

        res.json({
          success: true,
          milestoneId: milestoneResult.milestoneId,
          milestoneAchieved,
          progressStatus,
          progressPercentage: Math.round(progressAnalysis.progressPercentage),
          tokenReward,
          reassessmentTriggered,
          reassessmentReason: reassessmentNeeded.required ? reassessmentNeeded.reason : null,
          reassessmentConsultationId: reassessmentConsultation?.consultationId || null,
          adjustedRecommendations,
          nextMilestone,
          encouragement,
          timestamp: milestoneResult.timestamp
        });

      } catch (error) {
        logger.error(`Milestone feedback API error: ${error.message}`);
        res.status(500).json({
          error: 'Failed to process milestone feedback',
          message: error.message
        });
      }
    });

    // Cache management endpoints
    this.app.post('/cache/clear', (req, res) => {
      try {
        cacheManager.clear();
        logger.info('Cache cleared via API endpoint');

        res.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Cache clear API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to clear cache', message: error.message });
      }
    });

    this.app.get('/cache/stats', (req, res) => {
      try {
        const stats = cacheManager.getStats();

        res.json({
          success: true,
          stats,
          similarityCacheEnabled: process.env.ENABLE_SIMILARITY_CACHE === 'true',
          similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.8,
          cacheEnabled: process.env.ENABLE_CACHE === 'true',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Cache stats API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get cache stats', message: error.message });
      }
    });

    // Token management endpoints
    this.app.get('/tokens/balance/:agentId', (req, res) => {
      try {
        const { agentId } = req.params;
        const balance = this.tokenManager.getAgentBalance(agentId);
        
        if (!balance) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({
          success: true,
          balance,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Token balance API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get token balance', message: error.message });
      }
    });

    this.app.get('/tokens/statistics', (req, res) => {
      try {
        const stats = this.tokenManager.getNetworkStatistics();
        res.json({
          success: true,
          statistics: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Token statistics API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get token statistics', message: error.message });
      }
    });

    // Prediction market endpoints
    this.app.get('/predictions/market/statistics', (req, res) => {
      try {
        const marketStats = this.coordinator.getPredictionMarketStats();

        if (!marketStats) {
          return res.json({
            success: true,
            message: 'Prediction market not initialized',
            statistics: null
          });
        }

        res.json({
          success: true,
          statistics: marketStats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Prediction market stats API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get prediction market statistics', message: error.message });
      }
    });

    this.app.get('/predictions/agent/:agentId', (req, res) => {
      try {
        const { agentId } = req.params;
        const performance = this.coordinator.getAgentPredictionPerformance(agentId);

        if (!performance) {
          return res.status(404).json({ error: 'Agent prediction performance not found' });
        }

        res.json({
          success: true,
          agentId,
          performance,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Agent prediction performance API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get agent prediction performance', message: error.message });
      }
    });

    this.app.post('/predictions/resolve/md-review', async (req, res) => {
      try {
        const { consultationId, mdReviewData } = req.body;

        if (!consultationId || !mdReviewData) {
          return res.status(400).json({ error: 'consultationId and mdReviewData are required' });
        }

        const resolution = await this.coordinator.resolveMDReviewPredictions(consultationId, mdReviewData);

        res.json({
          success: true,
          consultationId,
          resolution,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`MD review resolution API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to resolve MD review predictions', message: error.message });
      }
    });

    this.app.post('/predictions/resolve/user-modal', async (req, res) => {
      try {
        const { consultationId, userFeedback } = req.body;

        if (!consultationId || !userFeedback) {
          return res.status(400).json({ error: 'consultationId and userFeedback are required' });
        }

        const resolution = await this.coordinator.resolveUserModalPredictions(consultationId, userFeedback);

        res.json({
          success: true,
          consultationId,
          resolution,
          // Cascading resolution metadata (for frontend to display)
          cascadingResolution: resolution?.cascadingResolution || null,
          recommendMDReview: resolution?.cascadingResolution?.recommendMDReview || false,
          totalAgentsResolved: resolution?.cascadingResolution?.totalAgentsResolved || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`User modal resolution API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to resolve user modal predictions', message: error.message });
      }
    });

    this.app.post('/predictions/resolve/follow-up', async (req, res) => {
      try {
        const { consultationId, followUpData } = req.body;

        if (!consultationId || !followUpData) {
          return res.status(400).json({ error: 'consultationId and followUpData are required' });
        }

        const resolution = await this.coordinator.resolveFollowUpPredictions(consultationId, followUpData);

        res.json({
          success: true,
          consultationId,
          resolution,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Follow-up resolution API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to resolve follow-up predictions', message: error.message });
      }
    });

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        name: 'OrthoIQ Agents API',
        version: '1.0.1',
        description: 'Multi-agent recovery ecosystem with token economics',
        endpoints: {
          health: 'GET /health - System health check',
          status: 'GET /status - Detailed system status',
          triage: 'POST /triage - Triage a patient case',
          consultation: 'POST /consultation - Multi-specialist consultation (supports ?noCache=true query param)',
          feedback: 'POST /feedback - Submit MD reviews and user satisfaction data',
          recovery: {
            start: 'POST /recovery/start - Start recovery tracking',
            update: 'POST /recovery/update - Update recovery progress',
            complete: 'POST /recovery/complete - Complete recovery tracking'
          },
          agents: 'POST /agents/:agentType/assess - Agent-specific assessment',
          cache: {
            clear: 'POST /cache/clear - Clear consultation cache',
            stats: 'GET /cache/stats - Get cache statistics and configuration'
          },
          tokens: {
            balance: 'GET /tokens/balance/:agentId - Get agent token balance',
            statistics: 'GET /tokens/statistics - Get network token statistics'
          },
          predictions: {
            marketStatistics: 'GET /predictions/market/statistics - Get prediction market statistics',
            agentPerformance: 'GET /predictions/agent/:agentId - Get agent prediction performance',
            resolveMDReview: 'POST /predictions/resolve/md-review - Resolve predictions with MD review data',
            resolveUserModal: 'POST /predictions/resolve/user-modal - Resolve predictions with user feedback modal',
            resolveFollowUp: 'POST /predictions/resolve/follow-up - Resolve predictions with user follow-up data'
          }
        },
        agents: Object.fromEntries(
          Object.entries(this.agents).map(([type, agent]) => [
            type,
            { name: agent.name, specialization: agent.subspecialty }
          ])
        )
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: '/docs'
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error(`API Error: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  /**
   * Validate query scope before processing
   * Returns response object if out of scope, null if should continue
   */
  validateQueryScope(req, res) {
    const caseData = req.body.caseData || req.body;
    const query = caseData.rawQuery || caseData.primaryComplaint || caseData.symptoms || '';

    logger.info({
      event: 'scope_validation_start',
      hasCaseData: !!req.body.caseData,
      extractedQuery: query?.substring(0, 100),
      validationEnabled: process.env.ENABLE_SCOPE_VALIDATION
    });

    const validation = validateScope(query, caseData);

    logger.info({
      event: 'scope_validation_result',
      passToAgent: validation.passToAgent,
      category: validation.category,
      detectedCategory: validation.detectedCategory,
      matchedTerms: validation.matchedTerms,
      confidence: validation.confidence
    });

    if (!validation.passToAgent) {
      logger.info({
        event: 'scope_validation_rejected',
        reason: validation.detectedCategory,
        redirecting: true
      });
      return res.status(200).json({
        success: false,
        scopeValidation: {
          category: 'out_of_scope',
          message: validation.redirectMessage,
          detectedCondition: validation.detectedCategory,
          confidence: validation.confidence
        },
        recommendation: 'CONSULT_APPROPRIATE_PROVIDER',
        timestamp: new Date().toISOString()
      });
    }
    return null; // Continue normal processing
  }

  async start() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('System initialization failed');
      }

      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.port, (error) => {
          if (error) {
            reject(error);
          } else {
            logger.info(`🌐 OrthoIQ Agents API server listening on port ${this.port}`);
            logger.info(`📚 API Documentation: http://localhost:${this.port}/docs`);
            logger.info(`💚 Health Check: http://localhost:${this.port}/health`);
            resolve(this.server);
          }
        });
      });
    } catch (error) {
      logger.error(`❌ Failed to start server: ${error.message}`);
      throw error;
    }
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('🛑 OrthoIQ Agents API server stopped');
          resolve();
        });
      });
    }
  }
  
  /**
   * Run learning mode analysis in background
   */
  async runLearningMode(caseData, fastResponse) {
    try {
      logger.info('Running learning mode analysis in background');
      
      // Use comprehensive prompts for deep analysis
      const learningPromises = Object.entries(this.agents).map(async ([type, agent]) => {
        const prompt = promptManager.getPrompt(agent, caseData, 'learning');
        return agent.processMessage(prompt.content, {
          mode: 'learning',
          fastResponse,
          caseData
        });
      });
      
      const learningResults = await Promise.allSettled(learningPromises);
      
      // Extract insights and patterns
      const insights = this.extractLearningInsights(learningResults);
      
      // Store for future training
      logger.info(`Learning mode completed: ${insights.patterns} patterns found`);
      
      return insights;
    } catch (error) {
      logger.error(`Learning mode error: ${error.message}`);
    }
  }
  
  extractLearningInsights(results) {
    // Process learning results for patterns
    return {
      patterns: results.filter(r => r.status === 'fulfilled').length,
      insights: results.map(r => r.value).filter(Boolean)
    };
  }
  
  async processMDReview(mdReview, consultationId) {
    try {
      logger.info(`Processing MD review for consultation ${consultationId}`);
      
      // Process corrections and feedback for each specialist
      if (mdReview.corrections && mdReview.corrections.length > 0) {
        for (const correction of mdReview.corrections) {
          logger.info(`MD correction noted: ${correction}`);
          // In future, could trigger retraining or adjustment
        }
      }
      
      // Process specialist accuracy ratings
      if (mdReview.specialistAccuracy) {
        for (const [specialist, accuracy] of Object.entries(mdReview.specialistAccuracy)) {
          logger.info(`${specialist} accuracy rated at ${accuracy}`);
          
          // Find the agent and update their learning metrics
          const agent = Object.values(this.agents).find(
            a => a.subspecialty.toLowerCase().includes(specialist.toLowerCase())
          );
          
          if (agent) {
            // Update agent's confidence based on MD feedback
            const currentConfidence = agent.getConfidence('consultation');
            const adjustment = accuracy - currentConfidence;
            
            if (Math.abs(adjustment) > 0.1) {
              logger.info(`Adjusting ${agent.name} confidence by ${adjustment}`);
              // This would trigger agent retraining in production
            }
          }
        }
      }
      
      // Process additional notes for system improvements
      if (mdReview.additionalNotes) {
        logger.info(`MD notes: ${mdReview.additionalNotes}`);
        // Store for future analysis
      }
      
      return {
        processed: true,
        consultationId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error processing MD review: ${error.message}`);
      throw error;
    }
  }
  
  async storeFeedbackForTraining(feedbackData) {
    try {
      // In production, this would store to a database
      // For now, we'll log it and keep in memory
      if (!this.feedbackHistory) {
        this.feedbackHistory = [];
      }

      this.feedbackHistory.push(feedbackData);

      // Trigger learning if enough feedback accumulated
      if (this.feedbackHistory.length >= 10) {
        logger.info('Sufficient feedback accumulated, triggering learning cycle');
        // This would trigger a retraining cycle
      }

      logger.info(`Feedback stored for consultation ${feedbackData.consultationId}`);

      return true;
    } catch (error) {
      logger.error(`Error storing feedback: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper methods for milestone feedback endpoint
   */

  analyzeMilestoneProgress(milestoneDay, progressData, recoveryRecord, originalConsultation) {
    // Calculate expected progress based on recovery timeline
    let expectedPainReduction = 0;
    let expectedFunctionalImprovement = 0;

    // Default expectations by day
    const milestoneExpectations = {
      3: { painReduction: 15, functionalImprovement: 10 },
      7: { painReduction: 30, functionalImprovement: 20 },
      14: { painReduction: 50, functionalImprovement: 40 },
      21: { painReduction: 65, functionalImprovement: 60 },
      30: { painReduction: 75, functionalImprovement: 75 }
    };

    // Find closest milestone
    const closestMilestone = Object.keys(milestoneExpectations)
      .map(Number)
      .reduce((prev, curr) => Math.abs(curr - milestoneDay) < Math.abs(prev - milestoneDay) ? curr : prev);

    expectedPainReduction = milestoneExpectations[closestMilestone].painReduction;
    expectedFunctionalImprovement = milestoneExpectations[closestMilestone].functionalImprovement;

    // Calculate actual progress
    const baselinePain = originalConsultation?.caseData?.painLevel || recoveryRecord?.baselineMetrics?.painLevel || 7;
    const actualPainReduction = ((baselinePain - progressData.painLevel) / baselinePain) * 100;

    const baselineFunctional = recoveryRecord?.baselineMetrics?.functionalScore || 50;
    const actualFunctionalImprovement = ((progressData.functionalScore - baselineFunctional) / (100 - baselineFunctional)) * 100;

    // Calculate overall progress percentage
    const painProgress = (actualPainReduction / expectedPainReduction) * 100;
    const functionalProgress = (actualFunctionalImprovement / expectedFunctionalImprovement) * 100;
    const adherenceProgress = (progressData.adherence || 0.8) * 100;

    const overallProgress = (painProgress + functionalProgress + adherenceProgress) / 3;

    // Determine status
    let status;
    let progressLevel;
    if (overallProgress >= 100) {
      status = 'on_track';
      progressLevel = 'excellent';
    } else if (overallProgress >= 80) {
      status = 'on_track';
      progressLevel = 'good';
    } else if (overallProgress >= 60) {
      status = 'needs_attention';
      progressLevel = 'fair';
    } else {
      status = 'concerning';
      progressLevel = 'poor';
    }

    return {
      progressPercentage: overallProgress,
      status,
      progressLevel,
      painProgress: {
        actual: actualPainReduction,
        expected: expectedPainReduction,
        percentage: painProgress
      },
      functionalProgress: {
        actual: actualFunctionalImprovement,
        expected: expectedFunctionalImprovement,
        percentage: functionalProgress
      },
      adherence: progressData.adherence || 0.8
    };
  }

  calculateMilestoneReward(progressPercentage, adherence, milestoneDay) {
    let baseReward = 50; // Base reward for achieving milestone

    // Adjust for milestone day (later milestones worth more)
    if (milestoneDay >= 30) baseReward = 100;
    else if (milestoneDay >= 21) baseReward = 80;
    else if (milestoneDay >= 14) baseReward = 70;
    else if (milestoneDay >= 7) baseReward = 60;

    // Apply progress multiplier
    let multiplier = 1.0;
    if (progressPercentage >= 120) multiplier = 1.5; // Excellent
    else if (progressPercentage >= 100) multiplier = 1.3; // Very good
    else if (progressPercentage >= 90) multiplier = 1.1; // Good
    else if (progressPercentage >= 80) multiplier = 1.0; // Achieved

    // Adherence bonus
    if (adherence >= 0.9) {
      multiplier += 0.2;
    }

    return Math.round(baseReward * multiplier);
  }

  shouldTriggerReassessment(progressAnalysis, progressData, patientReportedOutcome, milestoneDay) {
    const triggers = [];

    // Concerning progress status
    if (progressAnalysis.status === 'concerning') {
      triggers.push('Progress significantly below expected trajectory');
    }

    // Pain increasing instead of decreasing
    if (progressData.painLevel && progressData.painLevel > 7 && milestoneDay >= 7) {
      triggers.push('Pain level remains high after one week');
    }

    // Low adherence
    if (progressData.adherence < 0.6) {
      triggers.push('Low adherence to treatment plan (<60%)');
    }

    // New red flag symptoms
    if (progressData.concernFlags && progressData.concernFlags.length > 0) {
      const redFlags = progressData.concernFlags.filter(flag =>
        flag.includes('weakness') ||
        flag.includes('numbness') ||
        flag.includes('bowel') ||
        flag.includes('bladder') ||
        flag.includes('fever') ||
        flag.includes('infection')
      );
      if (redFlags.length > 0) {
        triggers.push(`New red flag symptoms detected: ${redFlags.join(', ')}`);
      }
    }

    // Patient reported worsening
    if (patientReportedOutcome?.overallProgress === 'worsening') {
      triggers.push('Patient reports worsening condition');
    }

    // Week 2+ with <60% expected progress
    if (milestoneDay >= 14 && progressAnalysis.progressPercentage < 60) {
      triggers.push('Minimal progress after 2 weeks');
    }

    return {
      required: triggers.length > 0,
      reason: triggers.join('; '),
      triggers
    };
  }

  async triggerReassessment(originalConsultation, progressData, reason, patientId) {
    try {
      logger.info(`Triggering reassessment: ${reason}`);

      // Build updated case data with current status
      // Handle case where originalConsultation may be null (not cached)
      const baseCaseData = originalConsultation?.caseData || {
        primaryComplaint: 'Follow-up assessment',
        age: 35,
        symptoms: progressData.concernFlags?.join(', ') || 'Ongoing symptoms'
      };

      const updatedCaseData = {
        ...baseCaseData,
        // Update with current status
        painLevel: progressData.painLevel,
        functionalScore: progressData.functionalScore,
        // Add context about why reassessment is needed
        reassessmentReason: reason,
        previousTreatment: originalConsultation?.consultation?.synthesizedRecommendations?.treatmentPlan,
        currentSymptoms: progressData.newSymptoms || [],
        concernFlags: progressData.concernFlags || [],
        isReassessment: true,
        priorConsultationId: originalConsultation?.consultationId || 'unknown'
      };

      // Call consultation endpoint programmatically
      const reassessmentResult = await this.coordinator.coordinateMultiSpecialistConsultation(
        updatedCaseData,
        originalConsultation?.requiredSpecialists || ['triage', 'painWhisperer', 'movementDetective', 'strengthSage', 'mindMender'],
        {
          mode: 'normal',
          isReassessment: true,
          reassessmentReason: reason
        }
      );

      const consultationId = `reassessment_${Date.now()}`;

      logger.info(`Reassessment completed: ${consultationId}`);

      return {
        consultationId,
        result: reassessmentResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Reassessment trigger error: ${error.message}`);
      throw error;
    }
  }

  generateAdjustedRecommendations(progressAnalysis, progressData, patientReportedOutcome, originalConsultation) {
    const recommendations = [];

    // Based on progress status
    if (progressAnalysis.status === 'concerning') {
      recommendations.push({
        category: 'immediate_action',
        recommendation: 'Schedule follow-up appointment with healthcare provider',
        priority: 'high',
        rationale: 'Progress below expected trajectory'
      });
    }

    // Based on pain progress
    if (progressAnalysis.painProgress.percentage < 70) {
      recommendations.push({
        category: 'pain_management',
        recommendation: 'Consider adjusting pain management strategy',
        priority: 'medium',
        rationale: 'Pain reduction slower than expected'
      });
    }

    // Based on adherence
    if (progressData.adherence < 0.7) {
      recommendations.push({
        category: 'adherence',
        recommendation: 'Identify and address barriers to treatment adherence',
        priority: 'high',
        rationale: 'Low adherence may be limiting recovery'
      });

      if (patientReportedOutcome?.difficultiesEncountered) {
        recommendations.push({
          category: 'support',
          recommendation: `Address reported difficulties: ${patientReportedOutcome.difficultiesEncountered.join(', ')}`,
          priority: 'medium',
          rationale: 'Patient-reported barriers to adherence'
        });
      }
    }

    // Based on functional progress
    if (progressAnalysis.functionalProgress.percentage < 70) {
      recommendations.push({
        category: 'therapy_adjustment',
        recommendation: 'Consider modifying exercise program or increasing PT frequency',
        priority: 'medium',
        rationale: 'Functional improvement below expected level'
      });
    }

    // Positive reinforcement
    if (progressAnalysis.status === 'on_track') {
      recommendations.push({
        category: 'continuation',
        recommendation: 'Continue current treatment plan',
        priority: 'low',
        rationale: 'Progress on track with expected trajectory'
      });
    }

    return recommendations;
  }

  getNextMilestone(currentMilestoneDay, recoveryRecord) {
    const milestoneDays = [3, 7, 14, 21, 30, 60, 90];
    const nextDay = milestoneDays.find(day => day > currentMilestoneDay);

    if (!nextDay) {
      return {
        day: null,
        message: 'Recovery tracking complete',
        expectedMetrics: null
      };
    }

    // Estimate expected metrics for next milestone
    const expectedMetrics = {
      painLevel: Math.max(0, 7 - (nextDay / 10)), // Rough estimate
      functionalScore: Math.min(95, 50 + (nextDay * 1.5)), // Rough estimate
      milestoneAchievements: this.getMilestoneExpectations(nextDay)
    };

    return {
      day: nextDay,
      daysUntilNext: nextDay - currentMilestoneDay,
      expectedMetrics
    };
  }

  getMilestoneExpectations(day) {
    const expectations = {
      3: ['Pain reduction begins', 'Initial inflammation control'],
      7: ['30% pain reduction', 'Return to basic activities'],
      14: ['50% pain improvement', 'Normal range of motion returning'],
      21: ['Significant functional improvement', 'Return to most daily activities'],
      30: ['75% recovery', 'Return to work/sport preparation'],
      60: ['Full functional recovery', 'Return to all activities'],
      90: ['Complete recovery', 'Return to pre-injury level']
    };

    return expectations[day] || ['Continue progress monitoring'];
  }

  generateEncouragementMessage(progressAnalysis, milestoneDay, progressData, patientReportedOutcome) {
    const painDiff = progressData.painLevel;
    const status = progressAnalysis.status;

    if (status === 'on_track' && progressAnalysis.progressLevel === 'excellent') {
      return `Outstanding progress! You've exceeded expectations at day ${milestoneDay}. Your dedication to the treatment plan is paying off. Keep up the excellent work!`;
    } else if (status === 'on_track') {
      return `Great progress! You're on track with your recovery at day ${milestoneDay}. Continue following your treatment plan, and you should reach your recovery goals on schedule.`;
    } else if (status === 'needs_attention') {
      return `You're making progress, but there's room for improvement. Focus on following your treatment plan closely, especially with exercise adherence. Small improvements each day add up!`;
    } else {
      return `Recovery can have ups and downs. If you're experiencing difficulties, please reach out to your healthcare provider. We're here to help adjust your plan as needed.`;
    }
  }

  async getStoredConsultation(consultationId) {
    // In production, this would query a database
    // For now, check in-memory cache
    try {
      // Check if consultation was cached
      if (this.consultationCache && this.consultationCache.has(consultationId)) {
        return this.consultationCache.get(consultationId);
      }

      logger.warn(`Consultation ${consultationId} not found in cache`);
      return null;
    } catch (error) {
      logger.error(`Error retrieving consultation: ${error.message}`);
      return null;
    }
  }

  async storeMilestoneFeedback(milestoneResult) {
    try {
      // Initialize storage if needed
      if (!this.milestoneFeedbackHistory) {
        this.milestoneFeedbackHistory = [];
      }

      this.milestoneFeedbackHistory.push(milestoneResult);

      // Also cache the consultation for retrieval
      if (!this.consultationCache) {
        this.consultationCache = new Map();
      }

      logger.info(`Milestone feedback stored: ${milestoneResult.milestoneId}`);

      // Store in cache manager for training
      if (milestoneResult.milestoneAchieved) {
        await this.cacheManager.storeForTraining({
          type: 'milestone_achievement',
          data: milestoneResult
        });
      }

      return true;
    } catch (error) {
      logger.error(`Error storing milestone feedback: ${error.message}`);
      return false;
    }
  }
}

// Start the system if this file is run directly
async function main() {
  const system = new OrthoIQAgentSystem();
  
  try {
    await system.start();
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      logger.info('📴 Received SIGINT, shutting down gracefully');
      await system.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('📴 Received SIGTERM, shutting down gracefully');
      await system.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error(`❌ Failed to start OrthoIQ Agent System: ${error.message}`);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default OrthoIQAgentSystem;