import React, { useState } from 'react';
import { ContractABI } from '../types';
import { encodeConstructorArgs, getConstructorTypes } from '../utils/constructorEncoder';

interface ContractArtifactsProps {
  contractABI: ContractABI | null;
  constructorArgs?: any[];
}

export const ContractArtifacts: React.FC<ContractArtifactsProps> = ({ 
  contractABI, 
  constructorArgs = [] 
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getConstructorTypesFromABI = (): string[] => {
    if (!contractABI) return [];
    return getConstructorTypes(contractABI);
  };

  const encodeConstructorArgsHex = (): string => {
    if (!contractABI || constructorArgs.length === 0) return '';
    
    try {
      return encodeConstructorArgs(contractABI, constructorArgs);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  if (!contractABI) {
    return null;
  }

  const abiJson = JSON.stringify(contractABI.abi, null, 2);
  const bytecode = contractABI.bytecode;
  const encodedArgs = encodeConstructorArgsHex();

  return (
    <div className="contract-artifacts">
      <h3>Contract Artifacts</h3>
      
      {/* Bytecode */}
      <div className="artifact-section">
        <div className="artifact-header">
          <h4>Bytecode</h4>
          <button
            onClick={() => copyToClipboard(bytecode, 'bytecode')}
            className={`copy-button ${copiedItem === 'bytecode' ? 'copied' : ''}`}
          >
            {copiedItem === 'bytecode' ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <div className="artifact-content">
          <pre className="artifact-code">{bytecode}</pre>
        </div>
      </div>

      {/* Constructor Arguments */}
      {constructorArgs.length > 0 && (
        <div className="artifact-section">
          <div className="artifact-header">
            <h4>Constructor Arguments (Encoded)</h4>
            <button
              onClick={() => copyToClipboard(encodedArgs, 'constructor-args')}
              className={`copy-button ${copiedItem === 'constructor-args' ? 'copied' : ''}`}
            >
              {copiedItem === 'constructor-args' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="artifact-content">
            <div className="constructor-info">
              <p><strong>Types:</strong> [{getConstructorTypesFromABI().join(', ')}]</p>
              <p><strong>Values:</strong> [{constructorArgs.join(', ')}]</p>
            </div>
            <pre className="artifact-code">{encodedArgs}</pre>
          </div>
        </div>
      )}

      {/* ABI */}
      <div className="artifact-section">
        <div className="artifact-header">
          <h4>ABI (JSON)</h4>
          <button
            onClick={() => copyToClipboard(abiJson, 'abi')}
            className={`copy-button ${copiedItem === 'abi' ? 'copied' : ''}`}
          >
            {copiedItem === 'abi' ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <div className="artifact-content">
          <pre className="artifact-code">{abiJson}</pre>
        </div>
      </div>

      {/* Contract Info */}
      <div className="artifact-section">
        <div className="artifact-header">
          <h4>Contract Information</h4>
        </div>
        <div className="artifact-content">
          <div className="contract-info">
            <p><strong>Name:</strong> {contractABI.contractName}</p>
            <p><strong>Functions:</strong> {contractABI.abi.filter(item => item.type === 'function').length}</p>
            <p><strong>Events:</strong> {contractABI.abi.filter(item => item.type === 'event').length}</p>
            <p><strong>Constructor Inputs:</strong> {getConstructorTypesFromABI().length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 