import { CdpEvmWalletProvider, AgentKit } from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { agentConfig } from '../config/agent-config.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import CdpAccountManager from '../utils/cdp-account-manager.js';

export class BaseAgent {
  constructor(name, specialization = 'general', accountManager = null) {
    this.name = name;
    this.specialization = specialization;
    this.experience = 0;
    this.confidenceThreshold = agentConfig.agent.minConfidenceThreshold;
    this.agentId = uuidv4();
    this.walletAddress = null;
    this.tokenBalance = 0;
    this.transactionHistory = [];
    this.collaboratingAgents = new Map();
    this.accountManager = accountManager;
    this.accountInfo = null;
    
    this.initializeAgent();
  }

  async initializeAgent() {
    try {
      // Initialize Claude LLM
      this.llm = new ChatAnthropic({
        anthropicApiKey: agentConfig.claude.apiKey,
        modelName: 'claude-3-sonnet-20250101',
        temperature: 0.7,
      });

      // Initialize blockchain features only if enabled
      if (process.env.ENABLE_BLOCKCHAIN === 'true') {
        try {
          logger.info(`Attempting to initialize CDP wallet for ${this.name}...`);
          
          // Step 1: Create CDP account if account manager is available
          if (this.accountManager) {
            this.accountInfo = await this.accountManager.createAgentAccount(this.name, this.agentId);
            logger.info(`Created CDP account for ${this.name}: ${this.accountInfo.address}`);
            
            // Optional: Fund account with faucet for testing
            try {
              const faucetResult = await this.accountManager.fundAccountWithFaucet(this.accountInfo);
              if (faucetResult) {
                logger.info(`Funded ${this.name} account with test ETH: ${faucetResult.explorerUrl}`);
              }
            } catch (faucetError) {
              logger.warn(`Faucet funding failed for ${this.name}, continuing without funds: ${faucetError.message}`);
            }
          }
          
          // Step 2: Initialize CDP Wallet Provider with the created account
          const walletConfig = {
            // Use CDP SDK variables with fallback to AgentKit variables
            apiKeyId: process.env.CDP_API_KEY_ID || process.env.CDP_API_KEY_NAME,
            apiKeySecret: process.env.CDP_API_KEY_SECRET || process.env.CDP_API_KEY_PRIVATE_KEY,
            networkId: agentConfig.network.id,
            walletSecret: process.env.CDP_WALLET_SECRET,
          };
          
          // If we have a specific account, use its address
          if (this.accountInfo) {
            walletConfig.address = this.accountInfo.address;
          }
          
          this.walletProvider = await CdpEvmWalletProvider.configureWithWallet(walletConfig);

          logger.info(`CDP Wallet Provider created for ${this.name}`);

          // Step 3: Create AgentKit instance with the wallet provider
          this.agentKit = await AgentKit.from({
            walletProvider: this.walletProvider,
          });

          logger.info(`AgentKit instance created for ${this.name}`);

          // Step 4: Get wallet address
          this.walletAddress = await this.walletProvider.getAddress();
          
          // Initialize CDP tools for LangChain integration
          this.cdpTools = await getLangChainTools(this.agentKit);

          logger.info(`Agent ${this.name} initialized successfully with CDP wallet ${this.walletAddress}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain initialization failed for ${this.name}, running in offline mode: ${blockchainError.message}`);
          logger.error(`Full error details: ${blockchainError.stack}`);
          this.walletAddress = `mock_wallet_${this.agentId}`;
        }
      } else {
        // Create mock wallet address for offline mode
        this.walletAddress = `mock_wallet_${this.agentId}`;
        logger.info(`Agent ${this.name} initialized successfully (blockchain disabled)`);
      }
    } catch (error) {
      logger.error(`Failed to initialize agent ${this.name}:`, error);
      throw error;
    }
  }

  async processMessage(message, context = {}) {
    try {
      logger.debug(`Agent ${this.name} processing message: ${message}`);
      
      // Basic message processing - to be overridden by specialized agents
      const response = await this.llm.invoke([
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: message,
        },
      ]);

      this.updateExperience();
      return response.content;
    } catch (error) {
      logger.error(`Error processing message in agent ${this.name}:`, error);
      throw error;
    }
  }

  getSystemPrompt() {
    return `You are ${this.name}, an AI agent specialized in ${this.specialization}. 
    You have ${this.experience} experience points and work within the OrthoIQ medical ecosystem.
    Provide helpful, accurate, and professional responses while maintaining medical ethics and safety standards.`;
  }

  updateExperience() {
    this.experience += agentConfig.agent.experienceMultiplier;
    logger.debug(`Agent ${this.name} experience updated to ${this.experience}`);
  }

  async updateExperienceWithTokens(outcome) {
    try {
      if (outcome.success) {
        const tokens = this.calculateTokenReward(outcome);
        this.tokenBalance += tokens;
        this.experience += 10;
        
        // Log the token transaction
        const transaction = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'reward',
          amount: tokens,
          reason: outcome.reason || 'successful_outcome',
          metadata: outcome
        };
        
        this.transactionHistory.push(transaction);
        
        logger.info(`${this.name} earned ${tokens} tokens for successful outcome. New balance: ${this.tokenBalance}`);
        
        return transaction;
      }
    } catch (error) {
      logger.error(`Error updating experience with tokens for ${this.name}:`, error);
      throw error;
    }
  }

  calculateTokenReward(outcome) {
    let tokens = 1; // Base reward
    
    if (outcome.mdApproval) tokens += 15;
    if (outcome.userSatisfaction >= 8) tokens += 5;
    if (outcome.functionalImprovement) tokens += 20;
    if (outcome.speedOfResolution) tokens += Math.min(outcome.speedOfResolution, 10);
    if (outcome.collaborationBonus) tokens += 3;
    
    return tokens;
  }

  async consultWithSpecialist(specialistType, caseData) {
    try {
      logger.info(`${this.name} consulting with ${specialistType} specialist`);
      
      // Find appropriate specialist from collaborating agents
      const specialist = this.collaboratingAgents.get(specialistType);
      
      if (!specialist) {
        logger.warn(`No ${specialistType} specialist available for consultation`);
        return null;
      }
      
      const consultation = await specialist.processMessage(
        `Consultation request: ${JSON.stringify(caseData)}`,
        { consultingAgent: this.name, type: 'specialist_consultation' }
      );
      
      // Record collaboration for token bonus
      this.recordCollaboration(specialist.name, 'consultation');
      
      return {
        specialist: specialist.name,
        consultation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error in specialist consultation:`, error);
      throw error;
    }
  }

  async synthesizeRecommendations(specialistResponses) {
    try {
      const synthesisPrompt = `
        Synthesize the following specialist recommendations into a cohesive treatment plan:
        ${JSON.stringify(specialistResponses, null, 2)}
        
        Provide:
        1. Unified assessment
        2. Prioritized treatment recommendations
        3. Timeline and milestones
        4. Potential conflicts or considerations
        5. Next steps
      `;
      
      const synthesis = await this.processMessage(synthesisPrompt);
      
      return {
        synthesizedBy: this.name,
        inputResponses: specialistResponses.length,
        recommendations: synthesis,
        confidence: this.getConfidence('synthesis'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error synthesizing recommendations:`, error);
      throw error;
    }
  }

  recordCollaboration(agentName, type) {
    const collaboration = {
      agent: agentName,
      type,
      timestamp: new Date().toISOString()
    };
    
    if (!this.collaboratingAgents.has(agentName)) {
      this.collaboratingAgents.set(agentName, { collaborations: [] });
    }
    
    const agentRecord = this.collaboratingAgents.get(agentName);
    agentRecord.collaborations.push(collaboration);
  }

  async processBlockchainTransaction(transactionData) {
    try {
      logger.info(`${this.name} processing blockchain transaction`);
      
      if (!this.walletProvider) {
        throw new Error('Wallet provider not initialized');
      }
      
      // Use wallet provider for blockchain interactions
      const result = await this.walletProvider.sendTransaction(transactionData);
      
      const transaction = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'blockchain_transaction',
        data: transactionData,
        result,
        walletAddress: this.walletAddress
      };
      
      this.transactionHistory.push(transaction);
      
      return transaction;
    } catch (error) {
      logger.error(`Blockchain transaction failed for ${this.name}:`, error);
      throw error;
    }
  }

  getConfidence(task) {
    // Simple confidence calculation - can be enhanced
    const baseConfidence = 0.5;
    const experienceBonus = Math.min(this.experience * 0.01, 0.4);
    return Math.min(baseConfidence + experienceBonus, 1.0);
  }

  canHandle(task) {
    return this.getConfidence(task) >= this.confidenceThreshold;
  }
}

export default BaseAgent;