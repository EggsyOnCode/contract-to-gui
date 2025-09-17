import React, { useState } from 'react';

interface DeployedContractReaderProps {
  onLoadContract: (address: string, abi: any[]) => void;
  isLoading?: boolean;
}

export const DeployedContractReader: React.FC<DeployedContractReaderProps> = ({ 
  onLoadContract, 
  isLoading = false 
}) => {
  const [contractAddress, setContractAddress] = useState('');
  const [abiInput, setAbiInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validateABI = (abiString: string): boolean => {
    try {
      const parsed = JSON.parse(abiString);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  };

  const handleLoadContract = () => {
    setError(null);

    if (!contractAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }

    if (!validateAddress(contractAddress)) {
      setError('Invalid contract address format');
      return;
    }

    if (!abiInput.trim()) {
      setError('Please enter the contract ABI');
      return;
    }

    try {
      const abi = JSON.parse(abiInput);
      if (!Array.isArray(abi) || abi.length === 0) {
        setError('Invalid ABI format');
        return;
      }

      onLoadContract(contractAddress, abi);
    } catch (err) {
      setError('Invalid JSON format for ABI');
    }
  };

  const handlePasteABI = () => {
    navigator.clipboard.readText().then(text => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setAbiInput(JSON.stringify(parsed, null, 2));
        }
      } catch {
        // If it's not valid JSON, just paste as is
        setAbiInput(text);
      }
    }).catch(() => {
      // Clipboard access denied or failed
    });
  };

  return (
    <div className="deployed-contract-reader">
      <h3>Read Deployed Contract</h3>
      <p className="description">
        Enter a deployed contract address and its ABI to read its state
      </p>
      
      <div className="input-group">
        <label htmlFor="contract-address">Contract Address:</label>
        <input
          id="contract-address"
          type="text"
          placeholder="0x..."
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          className="address-input"
        />
      </div>

      <div className="input-group">
        <label htmlFor="contract-abi">Contract ABI (JSON):</label>
        <div className="abi-input-container">
          <textarea
            id="contract-abi"
            placeholder="Paste the contract ABI here..."
            value={abiInput}
            onChange={(e) => setAbiInput(e.target.value)}
            className="abi-input"
            rows={8}
          />
          <button 
            type="button" 
            onClick={handlePasteABI}
            className="paste-button"
            title="Paste from clipboard"
          >
            📋
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        onClick={handleLoadContract}
        disabled={isLoading || !contractAddress.trim() || !abiInput.trim()}
        className="load-contract-button"
      >
        {isLoading ? 'Loading...' : 'Load Contract'}
      </button>
    </div>
  );
}; 