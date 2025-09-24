import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function testCDPAuthentication() {
  console.log('🔐 Testing CDP Authentication...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('1. Checking environment variables:');
    console.log(`   CDP_API_KEY_ID: ${process.env.CDP_API_KEY_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   CDP_API_KEY_SECRET: ${process.env.CDP_API_KEY_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   CDP_WALLET_SECRET: ${process.env.CDP_WALLET_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NETWORK_ID: ${process.env.NETWORK_ID}\n`);

    // Test 2: Initialize CDP Client with explicit parameters
    console.log('2. Initializing CDP Client with explicit auth...');
    const cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
      debugging: true
    });
    console.log('   ✅ CDP Client initialized successfully\n');

    // Test 3: Try to create an EVM account
    console.log('3. Testing EVM account creation...');
    const account = await cdpClient.evm.createAccount();
    console.log(`   ✅ Account created successfully: ${account.address}`);
    console.log(`   Network: ${account.network || 'base-sepolia'}\n`);

    // Test 4: Test faucet funding
    console.log('4. Testing faucet funding...');
    try {
      const faucetResponse = await cdpClient.evm.requestFaucet({
        address: account.address,
        network: 'base-sepolia',
        token: 'eth'
      });
      console.log(`   ✅ Faucet request successful: ${faucetResponse.transactionHash}`);
      console.log(`   Explorer: https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}\n`);
    } catch (faucetError) {
      console.log(`   ⚠️ Faucet error (this is often expected): ${faucetError.message}\n`);
    }

    console.log('🎉 CDP Authentication Test Completed Successfully!');
    console.log('Real wallets can now be created for agents.\n');
    
    return {
      success: true,
      accountAddress: account.address,
      network: account.network || 'base-sepolia'
    };

  } catch (error) {
    console.error('❌ CDP Authentication Test Failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCDPAuthentication()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testCDPAuthentication;