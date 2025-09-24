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

// Import all specialist agents
import { TriageAgent } from './agents/triage-agent.js';
import { PainWhispererAgent } from './agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from './agents/movement-detective-agent.js';
import { StrengthSageAgent } from './agents/strength-sage-agent.js';
import { MindMenderAgent } from './agents/mind-mender-agent.js';

// Load environment variables
dotenv.config();

class OrthoIQAgentSystem {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // Core system components
    this.coordinator = new AgentCoordinator();
    this.tokenManager = new TokenManager();
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

    // System status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const coordinationStats = this.coordinator.getCoordinationStatistics();
        const networkStats = this.tokenManager.getNetworkStatistics();
        const recoveryStats = this.recoveryMetrics.getRecoveryStatistics();
        const blockchainStats = await this.blockchainUtils.getNetworkStatistics();

        res.json({
          system: {
            initialized: this.isInitialized,
            uptime: process.uptime(),
            version: '1.0.0'
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

    // Multi-specialist consultation endpoint
    this.app.post('/consultation', async (req, res) => {
      try {
        const { caseData, requiredSpecialists } = req.body;
        
        const consultationResult = await this.coordinator.coordinateMultiSpecialistConsultation(
          caseData,
          requiredSpecialists || []
        );

        res.json({
          success: true,
          consultation: consultationResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Consultation API error: ${error.message}`);
        res.status(500).json({ error: 'Consultation failed', message: error.message });
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

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        name: 'OrthoIQ Agents API',
        version: '1.0.0',
        description: 'Multi-agent recovery ecosystem with token economics',
        endpoints: {
          health: 'GET /health - System health check',
          status: 'GET /status - Detailed system status',
          triage: 'POST /triage - Triage a patient case',
          consultation: 'POST /consultation - Multi-specialist consultation',
          recovery: {
            start: 'POST /recovery/start - Start recovery tracking',
            update: 'POST /recovery/update - Update recovery progress',
            complete: 'POST /recovery/complete - Complete recovery tracking'
          },
          agents: 'POST /agents/:agentType/assess - Agent-specific assessment',
          tokens: {
            balance: 'GET /tokens/balance/:agentId - Get agent token balance',
            statistics: 'GET /tokens/statistics - Get network token statistics'
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