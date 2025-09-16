export interface ContractFunction {
  name: string;
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
  inputs: ContractInput[];
  outputs?: ContractOutput[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  payable?: boolean;
  constant?: boolean;
}

export interface ContractInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
}

export interface ContractOutput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ContractABI {
  abi: ContractFunction[];
  bytecode: string;
  contractName: string;
}

export interface CompilerSettings {
  evmVersion: string;
  solcVersion: string;
  optimization: boolean;
  runs?: number;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  provider?: any;
  signer?: any;
}

export interface ContractCallResult {
  success: boolean;
  result?: any;
  error?: string;
  transactionHash?: string;
}
