import { useState, useCallback } from 'react';
import { ContractCompiler } from '../utils/compiler';
import { ContractInteraction } from '../utils/contractInteraction';
import { ContractABI, CompilerSettings, ContractCallResult } from '../types';

export const useContract = () => {
  const [contractABI, setContractABI] = useState<ContractABI | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [contractInteraction, setContractInteraction] = useState<ContractInteraction | null>(null);
  const [compiler] = useState(() => new ContractCompiler());

  const compileContract = useCallback(async (
    sourceCode: string,
    contractName: string,
    settings: CompilerSettings
  ) => {
    setIsCompiling(true);
    setCompilationError(null);
    
    try {
      const result = await compiler.compileContract(sourceCode, contractName, settings);
      setContractABI(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compilation failed';
      setCompilationError(errorMessage);
      console.error('Compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  }, [compiler]);

  const deployContract = useCallback(async (constructorArgs: any[] = []): Promise<ContractCallResult> => {
    if (!contractABI || !contractInteraction) {
      return {
        success: false,
        error: 'Contract not compiled or wallet not connected',
      };
    }

    return await contractInteraction.deployContract(contractABI, constructorArgs);
  }, [contractABI, contractInteraction]);

  const callFunction = useCallback(async (
    functionName: string,
    args: any[] = [],
    value?: string
  ): Promise<ContractCallResult> => {
    if (!contractInteraction) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

    return await contractInteraction.callFunction(functionName, args, value);
  }, [contractInteraction]);

  const setContractAddress = useCallback((address: string) => {
    if (contractABI && contractInteraction) {
      contractInteraction.setContractAddress(address, contractABI);
    }
  }, [contractABI, contractInteraction]);

  const initializeContractInteraction = useCallback((provider: any, signer: any) => {
    const interaction = new ContractInteraction(provider, signer);
    setContractInteraction(interaction);
  }, []);

  const getAvailableSolcVersions = useCallback(() => compiler.getAvailableSolcVersions(), [compiler]);
  const getAvailableEVMVersions = useCallback(() => compiler.getAvailableEVMVersions(), [compiler]);

  return {
    contractABI,
    isCompiling,
    compilationError,
    compileContract,
    deployContract,
    callFunction,
    setContractAddress,
    initializeContractInteraction,
    getAvailableSolcVersions,
    getAvailableEVMVersions,
  };
};
