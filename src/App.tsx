import { useState, useEffect } from 'react';
import { ContractUpload } from './components/ContractUpload';
import { DeployedContractReader } from './components/DeployedContractReader';
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
  const [activeTab, setActiveTab] = useState<'upload' | 'deployed'>('upload');
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
    loadDeployedContract,
    isLoadingDeployed,
    deployedContractError,
    getReadFunctions,
    getWriteFunctions,
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
    setActiveTab('upload');
  };

  const handleCompile = async () => {
    if (!sourceCode || !contractName) {
      alert('Please upload a contract file first');
      return;
    }

    await compileContract(sourceCode, contractName, compilerSettings);
  };

  const handleLoadDeployedContract = async (address: string, abi: any[]) => {
    await loadDeployedContract(address, abi);
    setActiveTab('deployed');
  };

  const getConstructorInputs = (): any[] => {
    if (!contractABI) return [];
    const constructor = contractABI.abi.find(item => item.type === 'constructor');
    return constructor?.inputs || [];
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Contract GUI - Smart Contract Dev Tool</h1>
        <p>Compile and interact with smart contracts on EVM chains</p>
      </header>

      <div className="app-content">
        <div className="left-panel">
          <div className="tab-container">
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload & Compile
            </button>
            <button 
              className={`tab-button ${activeTab === 'deployed' ? 'active' : ''}`}
              onClick={() => setActiveTab('deployed')}
            >
              Read Deployed
            </button>
          </div>

          {activeTab === 'upload' && (
            <>
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
            </>
          )}

          {activeTab === 'deployed' && (
            <DeployedContractReader
              onLoadContract={handleLoadDeployedContract}
              isLoading={isLoadingDeployed}
            />
          )}

          {deployedContractError && (
            <div className="deployed-contract-error">
              <h4>Error Loading Contract:</h4>
              <pre>{deployedContractError}</pre>
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
          {contractABI && (
            <>
              {activeTab === 'upload' && walletState.isConnected && (
                <ContractDeployer
                  onDeploy={deployContract}
                  constructorInputs={getConstructorInputs()}
                  isDeploying={false}
                />
              )}

              {activeTab === 'upload' && walletState.isConnected && (
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
              )}

              <ContractFunctions
                functions={getReadFunctions()}
                onCallFunction={callFunction}
                isReadOnly={true}
              />

              {walletState.isConnected && (
                <ContractFunctions
                  functions={getWriteFunctions()}
                  onCallFunction={callFunction}
                  isReadOnly={false}
                />
              )}

              {!walletState.isConnected && activeTab === 'upload' && (
                <div className="wallet-required">
                  <h3>Wallet Required</h3>
                  <p>Please connect your wallet to deploy or write to contracts</p>
                </div>
              )}

              {!walletState.isConnected && activeTab === 'deployed' && (
                <div className="wallet-info">
                  <h3>Read-Only Mode</h3>
                  <p>You can read contract state without connecting a wallet. Connect your wallet to enable write operations.</p>
                </div>
              )}
            </>
          )}

          {!contractABI && (
            <div className="no-contract">
              <h3>No Contract Loaded</h3>
              <p>Upload and compile a smart contract or load a deployed contract to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
