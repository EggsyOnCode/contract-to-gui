import { useState, useEffect } from 'react';
import { ContractUpload } from './components/ContractUpload';
import { CompilerSettingsComponent } from './components/CompilerSettings';
import { WalletConnector } from './components/WalletConnector';
import { ContractDeployer } from './components/ContractDeployer';
import { ContractFunctions } from './components/ContractFunctions';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { CompilerSettings, ContractFunction } from './types';
import './App.css';

function App() {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [contractName, setContractName] = useState<string>('');
  const [compilerSettings, setCompilerSettings] = useState<CompilerSettings>({
    evmVersion: 'shanghai',
    solcVersion: '0.8.30',
    optimization: false,
    runs: 200,
  });

  const {
    walletState,
    connectWallet,
    disconnectWallet,
    isConnecting,
  } = useWallet();

  const {
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
  } = useContract();

  // Initialize contract interaction when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.provider && walletState.signer) {
      initializeContractInteraction(walletState.provider, walletState.signer);
    }
  }, [walletState.isConnected, walletState.provider, walletState.signer, initializeContractInteraction]);

  const handleFileUpload = (content: string, filename: string) => {
    setSourceCode(content);
    // Extract contract name from filename (remove .sol extension)
    const name = filename.replace('.sol', '');
    setContractName(name);
  };

  const handleCompile = async () => {
    if (!sourceCode || !contractName) {
      alert('Please upload a contract file first');
      return;
    }

    await compileContract(sourceCode, contractName, compilerSettings);
  };

  const getConstructorInputs = (): any[] => {
    if (!contractABI) return [];
    const constructor = contractABI.abi.find(item => item.type === 'constructor');
    return constructor?.inputs || [];
  };

  const getReadFunctions = (): ContractFunction[] => {
    if (!contractABI) return [];
    return contractABI.abi.filter(
      (item): item is ContractFunction => 
        item.type === 'function' && 
        (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );
  };

  const getWriteFunctions = (): ContractFunction[] => {
    if (!contractABI) return [];
    return contractABI.abi.filter(
      (item): item is ContractFunction => 
        item.type === 'function' && 
        (item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Contract GUI - Smart Contract Dev Tool</h1>
        <p>Compile and interact with smart contracts on EVM chains</p>
      </header>

      <div className="app-content">
        <div className="left-panel">
          <ContractUpload onFileUpload={handleFileUpload} />
          
          {sourceCode && (
            <CompilerSettingsComponent
              settings={compilerSettings}
              onSettingsChange={setCompilerSettings}
              availableSolcVersions={getAvailableSolcVersions()}
              availableEVMVersions={getAvailableEVMVersions()}
            />
          )}

          {sourceCode && (
            <div className="compile-section">
              <button 
                onClick={handleCompile} 
                disabled={isCompiling}
                className="compile-button"
              >
                {isCompiling ? 'Compiling...' : 'Compile Contract'}
              </button>
              {compilationError && (
                <div className="compilation-error">
                  <h4>Compilation Error:</h4>
                  <pre>{compilationError}</pre>
                </div>
              )}
            </div>
          )}

          <WalletConnector
            walletState={walletState}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            isConnecting={isConnecting}
          />
        </div>

        <div className="right-panel">
          {contractABI && walletState.isConnected && (
            <>
              <ContractDeployer
                onDeploy={deployContract}
                constructorInputs={getConstructorInputs()}
                isDeploying={false}
              />

              <div className="contract-address-section">
                <h3>Set Contract Address</h3>
                <div className="address-input-group">
                  <input
                    type="text"
                    placeholder="Enter deployed contract address"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setContractAddress(e.target.value);
                      }
                    }}
                    className="address-input"
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('.address-input') as HTMLInputElement;
                      if (input?.value) {
                        setContractAddress(input.value);
                      }
                    }}
                    className="set-address-button"
                  >
                    Set Address
                  </button>
                </div>
              </div>

              <ContractFunctions
                functions={getReadFunctions()}
                onCallFunction={callFunction}
                isReadOnly={true}
              />

              <ContractFunctions
                functions={getWriteFunctions()}
                onCallFunction={callFunction}
                isReadOnly={false}
              />
            </>
          )}

          {contractABI && !walletState.isConnected && (
            <div className="wallet-required">
              <h3>Wallet Required</h3>
              <p>Please connect your wallet to interact with the contract</p>
            </div>
          )}

          {!contractABI && (
            <div className="no-contract">
              <h3>No Contract Loaded</h3>
              <p>Upload and compile a smart contract to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
