import { CdpClient } from '@coinbase/cdp-sdk';
import logger from './logger.js';

export class CdpAccountManager {
  constructor() {
    this.cdpClient = null;
    this.createdAccounts = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing CDP Account Manager');
      
      // Initialize CDP client with explicit authentication parameters
      this.cdpClient = new CdpClient({
        apiKeyId: process.env.CDP_API_KEY_ID,
        apiKeySecret: process.env.CDP_API_KEY_SECRET,
        walletSecret: process.env.CDP_WALLET_SECRET,
        debugging: process.env.NODE_ENV === 'development'
      });
      
      logger.info('✅ CDP Account Manager initialized successfully with explicit auth');
      return true;
    } catch (error) {
      logger.error(`❌ CDP Account Manager initialization failed: ${error.message}`);
      logger.error('Check that CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET are set correctly');
      throw error;
    }
  }

  async createAgentAccount(agentName, agentId) {
    try {
      logger.info(`Creating CDP account for agent: ${agentName}`);
      
      if (!this.cdpClient) {
        throw new Error('CDP Client not initialized');
      }

      // Create EVM account on Base Sepolia
      const account = await this.cdpClient.evm.createAccount();
      
      logger.info(`✅ Created CDP account for ${agentName}: ${account.address}`);
      
      // Store account info
      const accountInfo = {
        agentName,
        agentId,
        address: account.address,
        createdAt: new Date().toISOString(),
        network: 'base-sepolia'
      };
      
      this.createdAccounts.set(agentId, accountInfo);
      
      return accountInfo;
    } catch (error) {
      logger.error(`❌ Failed to create CDP account for ${agentName}: ${error.message}`);
      throw error;
    }
  }

  async fundAccountWithFaucet(accountInfo, amount = 'eth') {
    try {
      logger.info(`Requesting faucet funds for ${accountInfo.agentName} at ${accountInfo.address}`);
      
      const faucetResponse = await this.cdpClient.evm.requestFaucet({
        address: accountInfo.address,
        network: 'base-sepolia',
        token: amount
      });
      
      logger.info(`✅ Faucet request successful for ${accountInfo.agentName}: https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}`);
      
      return {
        transactionHash: faucetResponse.transactionHash,
        explorerUrl: `https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}`
      };
    } catch (error) {
      logger.warn(`⚠️ Faucet request failed for ${accountInfo.agentName}: ${error.message}`);
      // Don't throw error since faucet failures shouldn't stop agent creation
      return null;
    }
  }

  getAccountInfo(agentId) {
    return this.createdAccounts.get(agentId);
  }

  getAllAccounts() {
    return Array.from(this.createdAccounts.values());
  }

  async close() {
    if (this.cdpClient) {
      // CDP SDK doesn't seem to have an explicit close method, so just clean up references
      this.cdpClient = null;
      logger.info('CDP Account Manager closed');
    }
  }
}

export default CdpAccountManager;