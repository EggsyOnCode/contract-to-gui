import { useState, useCallback } from 'react';
import { ContractCompiler } from '../utils/compiler';
import { ContractInteraction } from '../utils/contractInteraction';
import { ContractABI, CompilerSettings, ContractCallResult, ContractFunction } from '../types';

export const useContract = () => {
  const [contractABI, setContractABI] = useState<ContractABI | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [contractInteraction, setContractInteraction] = useState<ContractInteraction | null>(null);
  const [isLoadingDeployed, setIsLoadingDeployed] = useState(false);
  const [deployedContractError, setDeployedContractError] = useState<string | null>(null);
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

  const loadDeployedContract = useCallback(async (address: string, abi: any[]) => {
    setIsLoadingDeployed(true);
    setDeployedContractError(null);
    
    try {
      const interaction = new ContractInteraction();
      await interaction.setDeployedContractAddress(address, abi);
      setContractInteraction(interaction);
      
      // Create a mock ContractABI object for consistency
      const mockContractABI: ContractABI = {
        abi,
        bytecode: '', // Not needed for deployed contracts
        contractName: 'Deployed Contract',
      };
      setContractABI(mockContractABI);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load deployed contract';
      setDeployedContractError(errorMessage);
      console.error('Deployed contract error:', error);
    } finally {
      setIsLoadingDeployed(false);
    }
  }, []);

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
        error: 'Contract not loaded',
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
    const interaction = new ContractInteraction();
    setContractInteraction(interaction);
  }, []);

  const getAvailableSolcVersions = useCallback(() => compiler.getAvailableSolcVersions(), [compiler]);
  const getAvailableEVMVersions = useCallback(() => compiler.getAvailableEVMVersions(), [compiler]);

  // New functions for deployed contracts
  const getReadFunctions = useCallback((): ContractFunction[] => {
    if (!contractABI || !contractInteraction) return [];
    return contractInteraction.getReadFunctionsFromABI(contractABI.abi);
  }, [contractABI, contractInteraction]);

  const getWriteFunctions = useCallback((): ContractFunction[] => {
    if (!contractABI || !contractInteraction) return [];
    return contractInteraction.getWriteFunctionsFromABI(contractABI.abi);
  }, [contractABI, contractInteraction]);

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
    // New functions for deployed contracts
    loadDeployedContract,
    isLoadingDeployed,
    deployedContractError,
    getReadFunctions,
    getWriteFunctions,
  };
};
