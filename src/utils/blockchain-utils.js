import { ethers } from 'ethers';
import logger from './logger.js';
import { agentConfig } from '../config/agent-config.js';

export class BlockchainUtils {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contracts = new Map();
    this.transactionHistory = [];
    this.networkInfo = null;
  }

  async initialize() {
    try {
      logger.info('Initializing blockchain utilities');
      
      // Initialize provider for Base Sepolia testnet
      const rpcUrl = this.getRpcUrl(agentConfig.network.id);
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Initialize wallet if private key is available
      if (agentConfig.cdp.privateKey) {
        this.wallet = new ethers.Wallet(agentConfig.cdp.privateKey, this.provider);
        logger.info(`Wallet initialized: ${this.wallet.address}`);
      }
      
      // Get network information
      this.networkInfo = await this.provider.getNetwork();
      logger.info(`Connected to network: ${this.networkInfo.name} (Chain ID: ${this.networkInfo.chainId})`);
      
      return {
        provider: !!this.provider,
        wallet: !!this.wallet,
        network: this.networkInfo.name,
        chainId: Number(this.networkInfo.chainId)
      };
    } catch (error) {
      logger.error(`Failed to initialize blockchain utilities: ${error.message}`);
      throw error;
    }
  }

  getRpcUrl(networkId) {
    const rpcUrls = {
      'base-sepolia': 'https://sepolia.base.org',
      'base-mainnet': 'https://mainnet.base.org',
      'base': 'https://mainnet.base.org'
    };
    
    return rpcUrls[networkId] || rpcUrls['base-sepolia'];
  }

  async getWalletBalance(address = null) {
    try {
      const walletAddress = address || this.wallet?.address;
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }
      
      const balance = await this.provider.getBalance(walletAddress);
      const balanceInEth = ethers.formatEther(balance);
      
      return {
        address: walletAddress,
        balance: balanceInEth,
        balanceWei: balance.toString(),
        currency: 'ETH'
      };
    } catch (error) {
      logger.error(`Error getting wallet balance: ${error.message}`);
      throw error;
    }
  }

  async sendTransaction(toAddress, amountEth, data = '0x') {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      logger.info(`Sending transaction: ${amountEth} ETH to ${toAddress}`);
      
      const tx = {
        to: toAddress,
        value: ethers.parseEther(amountEth.toString()),
        data: data
      };
      
      // Estimate gas
      const gasEstimate = await this.provider.estimateGas(tx);
      tx.gasLimit = gasEstimate;
      
      // Get gas price
      const feeData = await this.provider.getFeeData();
      tx.maxFeePerGas = feeData.maxFeePerGas;
      tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      
      // Send transaction
      const txResponse = await this.wallet.sendTransaction(tx);
      
      logger.info(`Transaction sent: ${txResponse.hash}`);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      
      const transactionRecord = {
        hash: txResponse.hash,
        from: this.wallet.address,
        to: toAddress,
        value: amountEth,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'success' : 'failed',
        timestamp: new Date().toISOString()
      };
      
      this.transactionHistory.push(transactionRecord);
      
      logger.info(`Transaction confirmed: ${txResponse.hash} (Block: ${receipt.blockNumber})`);
      
      return transactionRecord;
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`);
      throw error;
    }
  }

  async deployContract(contractAbi, contractBytecode, constructorArgs = []) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      logger.info('Deploying smart contract');
      
      const contractFactory = new ethers.ContractFactory(
        contractAbi,
        contractBytecode,
        this.wallet
      );
      
      const contract = await contractFactory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      
      logger.info(`Contract deployed at: ${contractAddress}`);
      
      // Store contract reference
      this.contracts.set(contractAddress, {
        contract,
        abi: contractAbi,
        deployedAt: new Date().toISOString()
      });
      
      return {
        address: contractAddress,
        transactionHash: contract.deploymentTransaction()?.hash,
        contract
      };
    } catch (error) {
      logger.error(`Contract deployment failed: ${error.message}`);
      throw error;
    }
  }

  async interactWithContract(contractAddress, functionName, args = [], value = 0) {
    try {
      const contractInfo = this.contracts.get(contractAddress);
      if (!contractInfo) {
        throw new Error(`Contract not found: ${contractAddress}`);
      }
      
      logger.info(`Calling ${functionName} on contract ${contractAddress}`);
      
      const contract = contractInfo.contract;
      
      // Prepare transaction options
      const txOptions = {};
      if (value > 0) {
        txOptions.value = ethers.parseEther(value.toString());
      }
      
      // Call contract function
      const tx = await contract[functionName](...args, txOptions);
      
      if (tx.wait) {
        // This is a transaction that modifies state
        const receipt = await tx.wait();
        
        const interactionRecord = {
          contractAddress,
          functionName,
          args,
          value,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'success' : 'failed',
          timestamp: new Date().toISOString()
        };
        
        this.transactionHistory.push(interactionRecord);
        
        return {
          ...interactionRecord,
          result: receipt
        };
      } else {
        // This is a read-only call
        return {
          contractAddress,
          functionName,
          args,
          result: tx,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error(`Contract interaction failed: ${error.message}`);
      throw error;
    }
  }

  async createAgentTokenContract() {
    try {
      logger.info('Creating OrthoIQ Agent Token contract');
      
      // Simple ERC20-like token contract ABI
      const tokenAbi = [
        "constructor(string name, string symbol, uint256 totalSupply)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount) returns (bool)",
        "function burn(uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
      ];
      
      // This would be the actual bytecode in a real implementation
      const tokenBytecode = "0x608060405234801561001057600080fd5b50..."; // Placeholder
      
      // Deploy token contract
      const deployment = await this.deployContract(
        tokenAbi,
        tokenBytecode,
        ["OrthoIQ Agent Token", "OAT", ethers.parseEther("1000000")] // 1M tokens
      );
      
      return {
        tokenAddress: deployment.address,
        name: "OrthoIQ Agent Token",
        symbol: "OAT",
        totalSupply: "1000000",
        deploymentTx: deployment.transactionHash
      };
    } catch (error) {
      logger.error(`Failed to create agent token contract: ${error.message}`);
      // Return mock contract for development
      return this.createMockTokenContract();
    }
  }

  createMockTokenContract() {
    const mockAddress = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`;
    
    logger.info(`Created mock token contract at: ${mockAddress}`);
    
    return {
      tokenAddress: mockAddress,
      name: "OrthoIQ Agent Token (Mock)",
      symbol: "OAT",
      totalSupply: "1000000",
      deploymentTx: `0x${Math.random().toString(16).substring(2, 66)}`,
      isMock: true
    };
  }

  async mintTokensToAgent(tokenAddress, agentAddress, amount) {
    try {
      logger.info(`Minting ${amount} tokens to agent: ${agentAddress}`);
      
      // In a real implementation, this would call the mint function
      const mintResult = await this.interactWithContract(
        tokenAddress,
        'mint',
        [agentAddress, ethers.parseEther(amount.toString())]
      );
      
      return mintResult;
    } catch (error) {
      logger.error(`Token minting failed: ${error.message}`);
      
      // Return mock mint for development
      return {
        contractAddress: tokenAddress,
        functionName: 'mint',
        args: [agentAddress, amount],
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: 'success',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }
  }

  async transferTokensBetweenAgents(tokenAddress, fromAddress, toAddress, amount) {
    try {
      logger.info(`Transferring ${amount} tokens from ${fromAddress} to ${toAddress}`);
      
      const transferResult = await this.interactWithContract(
        tokenAddress,
        'transferFrom',
        [fromAddress, toAddress, ethers.parseEther(amount.toString())]
      );
      
      return transferResult;
    } catch (error) {
      logger.error(`Token transfer failed: ${error.message}`);
      
      // Return mock transfer for development
      return {
        contractAddress: tokenAddress,
        functionName: 'transferFrom',
        args: [fromAddress, toAddress, amount],
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: 'success',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }
  }

  async getTokenBalance(tokenAddress, agentAddress) {
    try {
      const balanceResult = await this.interactWithContract(
        tokenAddress,
        'balanceOf',
        [agentAddress]
      );
      
      const balance = ethers.formatEther(balanceResult.result);
      
      return {
        address: agentAddress,
        balance: balance,
        tokenAddress: tokenAddress,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to get token balance: ${error.message}`);
      
      // Return mock balance for development
      return {
        address: agentAddress,
        balance: "0.0",
        tokenAddress: tokenAddress,
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }
  }

  async recordMedicalOutcome(patientId, outcome, agentId) {
    try {
      logger.info(`Recording medical outcome on blockchain for patient: ${patientId}`);
      
      // Create outcome hash for privacy
      const outcomeHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          patientId,
          outcome,
          agentId,
          timestamp: new Date().toISOString()
        }))
      );
      
      // In a real implementation, this would call a medical records contract
      const recordTx = await this.sendTransaction(
        this.wallet.address, // Self-send to record data
        0, // No ETH transfer
        outcomeHash // Outcome hash as data
      );
      
      return {
        patientId,
        outcomeHash,
        transactionHash: recordTx.hash,
        blockNumber: recordTx.blockNumber,
        agentId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to record medical outcome: ${error.message}`);
      throw error;
    }
  }

  async verifyMedicalRecord(transactionHash) {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      return {
        hash: transactionHash,
        verified: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        timestamp: tx.timestamp || new Date().toISOString(),
        gasUsed: receipt.gasUsed.toString(),
        dataHash: tx.data
      };
    } catch (error) {
      logger.error(`Medical record verification failed: ${error.message}`);
      throw error;
    }
  }

  async createReputationScore(agentId, scores) {
    try {
      logger.info(`Creating reputation score for agent: ${agentId}`);
      
      const reputationData = {
        agentId,
        scores,
        timestamp: new Date().toISOString(),
        version: 1
      };
      
      const reputationHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(reputationData))
      );
      
      // Record reputation on blockchain
      const reputationTx = await this.sendTransaction(
        this.wallet.address,
        0,
        reputationHash
      );
      
      return {
        agentId,
        reputationHash,
        transactionHash: reputationTx.hash,
        scores,
        timestamp: reputationData.timestamp
      };
    } catch (error) {
      logger.error(`Failed to create reputation score: ${error.message}`);
      throw error;
    }
  }

  async getNetworkStatistics() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      const balance = this.wallet ? await this.getWalletBalance() : null;
      
      return {
        networkName: this.networkInfo?.name || 'Unknown',
        chainId: Number(this.networkInfo?.chainId) || 0,
        currentBlock: blockNumber,
        gasPrice: {
          standard: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
          maxFee: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
          priorityFee: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei')
        },
        walletBalance: balance,
        totalTransactions: this.transactionHistory.length,
        contractsDeployed: this.contracts.size
      };
    } catch (error) {
      logger.error(`Failed to get network statistics: ${error.message}`);
      return {
        error: error.message,
        networkInitialized: !!this.provider
      };
    }
  }

  getTransactionHistory(limit = 10) {
    return this.transactionHistory
      .slice(-limit)
      .reverse();
  }

  async estimateGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to estimate gas price: ${error.message}`);
      throw error;
    }
  }

  validateAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  formatEther(weiValue) {
    return ethers.formatEther(weiValue);
  }

  parseEther(etherValue) {
    return ethers.parseEther(etherValue.toString());
  }

  generateRandomWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase
    };
  }

  async isConnected() {
    try {
      if (!this.provider) return false;
      
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber > 0;
    } catch (error) {
      return false;
    }
  }

  // Development and testing utilities
  async fundTestWallet(address, amountEth = 0.1) {
    try {
      logger.info(`Funding test wallet ${address} with ${amountEth} ETH`);
      
      // This would typically use a faucet or test network funding
      // For now, simulate funding
      return {
        address,
        funded: amountEth,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        timestamp: new Date().toISOString(),
        isTestFunding: true
      };
    } catch (error) {
      logger.error(`Test wallet funding failed: ${error.message}`);
      throw error;
    }
  }

  createTestEnvironment() {
    return {
      network: 'base-sepolia',
      rpcUrl: this.getRpcUrl('base-sepolia'),
      faucetUrl: 'https://faucet.quicknode.com/base/sepolia',
      explorerUrl: 'https://sepolia-explorer.base.org',
      testTokens: {
        OAT: this.createMockTokenContract()
      }
    };
  }
}

export default BlockchainUtils;