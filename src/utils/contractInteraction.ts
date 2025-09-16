import { Contract, BrowserProvider, JsonRpcSigner, ContractFactory } from '@armchain-ethersv6/ethers';
import { ContractABI, ContractCallResult, ContractFunction } from '../types';

export class ContractInteraction {
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  constructor(provider: BrowserProvider | null, signer: JsonRpcSigner | null) {
    this.provider = provider;
    this.signer = signer;
  }

  deployContract(contractABI: ContractABI, constructorArgs: any[] = []): Promise<ContractCallResult> {
    return new Promise(async (resolve) => {
      try {
        if (!this.signer) {
          resolve({
            success: false,
            error: 'Wallet not connected',
          });
          return;
        }

        // Create ContractFactory with bytecode and ABI
        const factory = new ContractFactory(contractABI.abi, contractABI.bytecode, this.signer);
        
        // Deploy the contract with constructor arguments
        const contract = await factory.deploy(...constructorArgs);
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
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  setContractAddress(address: string, contractABI: ContractABI): void {
    if (!this.provider) {
      throw new Error('Provider not available');
    }

    this.contract = new Contract(address, contractABI.abi, this.signer || this.provider);
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
