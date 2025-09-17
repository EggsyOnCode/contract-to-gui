import { Contract, BrowserProvider, JsonRpcSigner, ContractFactory, ethers } from '@armchain-ethersv6/ethers';
import { ContractABI, ContractCallResult, ContractFunction } from '../types';

export class ContractInteraction {
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  constructor() {
    // No longer need provider/signer parameters since we'll use window.ethereum
  }

private async ensureWalletConnected(): Promise<{ provider: BrowserProvider; signer: JsonRpcSigner } | null> {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install a wallet like MetaMask.');
  }

  // Check if already connected
  let accounts = await window.ethereum.request({ method: 'eth_accounts' });
  console.log('accounts', accounts);
  
  
  if (accounts.length === 0) {
    // Try different connection methods
    try {
      // Method 1: Standard eth_requestAccounts
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      try {
        // Method 2: Wallet permissions (EIP-2255)
        await window.ethereum.request({ 
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        // Re-check accounts after permission
        accounts = await window.ethereum.request({ method: 'eth_accounts' });
      } catch (permError) {
        throw new Error('User rejected connection request or wallet is locked');
      }
    }
  }

  if (accounts.length === 0) {
    throw new Error('No accounts available. Please unlock your wallet and try again.');
  }

  // Create provider and signer from window.ethereum
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  this.provider = provider;
  this.signer = signer;

  return { provider, signer };
}

  deployContract(contractABI: ContractABI, constructorArgs: any[] = []): Promise<ContractCallResult> {
    return new Promise(async (resolve) => {
      try {
        const wallet = await this.ensureWalletConnected();
        if (!wallet) {
          resolve({
            success: false,
            error: 'Failed to connect wallet',
          });
          return;
        }

        const { signer } = wallet;

        // Create ContractFactory with bytecode and ABI
        const factory = new ContractFactory(contractABI.abi, contractABI.bytecode, signer);
        
        // Deploy the contract with constructor arguments
        // This will trigger a wallet popup for transaction confirmation
        const contract = await factory.deploy(...constructorArgs);
        
        // Wait for the deployment transaction to be mined
        await contract.waitForDeployment();

        this.contract = contract as Contract;
        const address = await contract.getAddress();

        resolve({
          success: true,
          result: {
            address,
            transactionHash: contract.deploymentTransaction()?.hash,
          },
        });
      } catch (error) {
        console.error('Deployment error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  setContractAddress(address: string, contractABI: ContractABI): void {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    this.contract = new Contract(address, contractABI.abi, this.signer);
  }

  async callFunction(
    functionName: string,
    args: any[] = [],
    value?: string
  ): Promise<ContractCallResult> {
    return new Promise(async (resolve) => {
      try {
        if (!this.contract) {
          resolve({
            success: false,
            error: 'Contract not deployed or address not set',
          });
          return;
        }

        // Ensure wallet is still connected
        const wallet = await this.ensureWalletConnected();
        if (!wallet) {
          resolve({
            success: false,
            error: 'Failed to connect wallet',
          });
          return;
        }

        const functionABI = this.contract.interface.getFunction(functionName);
        if (!functionABI) {
          resolve({
            success: false,
            error: `Function ${functionName} not found in contract ABI`,
          });
          return;
        }

        let result;
        if (functionABI.stateMutability === 'view' || functionABI.stateMutability === 'pure') {
          // Read function
          result = await this.contract[functionName](...args);
        } else {
          // Write function
          const tx = await this.contract[functionName](...args, {
            value: value ? value : undefined,
          });
          const receipt = await tx.wait();
          result = {
            transactionHash: receipt?.hash,
            gasUsed: receipt?.gasUsed?.toString(),
            blockNumber: receipt?.blockNumber,
          };
        }

        resolve({
          success: true,
          result,
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  getContractFunctions(contractABI: ContractABI): ContractFunction[] {
    return contractABI.abi.filter(
      (item): item is ContractFunction => item.type === 'function'
    );
  }

  getReadFunctions(contractABI: ContractABI): ContractFunction[] {
    return this.getContractFunctions(contractABI).filter(
      (func) => func.stateMutability === 'view' || func.stateMutability === 'pure'
    );
  }

  getWriteFunctions(contractABI: ContractABI): ContractFunction[] {
    return this.getContractFunctions(contractABI).filter(
      (func) => func.stateMutability === 'nonpayable' || func.stateMutability === 'payable'
    );
  }
}
