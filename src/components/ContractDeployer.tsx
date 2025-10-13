import React, { useState } from 'react';
import { ContractCallResult } from '../types';

interface ContractDeployerProps {
  onDeploy: (constructorArgs: any[]) => Promise<ContractCallResult>;
  constructorInputs: any[];
  isDeploying: boolean;
  onConstructorArgsChange?: (args: any[]) => void;
}

export const ContractDeployer: React.FC<ContractDeployerProps> = ({
  onDeploy,
  constructorInputs,
  isDeploying,
  onConstructorArgsChange,
}) => {
  const [constructorArgs, setConstructorArgs] = useState<any[]>([]);
  const [deployResult, setDeployResult] = useState<ContractCallResult | null>(null);

  const handleInputChange = (index: number, value: any) => {
    const newArgs = [...constructorArgs];
    newArgs[index] = value;
    setConstructorArgs(newArgs);
    onConstructorArgsChange?.(newArgs);
  };

  const handleDeploy = async () => {
    const result = await onDeploy(constructorArgs);
    setDeployResult(result);
  };

  if (constructorInputs.length === 0) {
    return (
      <div className="contract-deployer">
        <h3>Deploy Contract</h3>
        <button 
          onClick={handleDeploy} 
          disabled={isDeploying}
          className="deploy-button"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Contract'}
        </button>
        {deployResult && (
          <div className={`deploy-result ${deployResult.success ? 'success' : 'error'}`}>
            <h4>Deployment Result:</h4>
            {deployResult.success ? (
              <div>
                <p><strong>Contract Address:</strong> {deployResult.result?.address}</p>
                <p><strong>Transaction Hash:</strong> {deployResult.result?.transactionHash}</p>
              </div>
            ) : (
              <p className="error-message">{deployResult.error}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="contract-deployer">
      <h3>Deploy Contract</h3>
      <div className="constructor-inputs">
        <h4>Constructor Parameters:</h4>
        {constructorInputs.map((input, index) => (
          <div key={index} className="input-group">
            <label htmlFor={`constructor-${index}`}>
              {input.name} ({input.type})
            </label>
            <input
              id={`constructor-${index}`}
              type="text"
              placeholder={`Enter ${input.name}`}
              value={constructorArgs[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
            />
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleDeploy} 
        disabled={isDeploying}
        className="deploy-button"
      >
        {isDeploying ? 'Deploying...' : 'Deploy Contract'}
      </button>

      {deployResult && (
        <div className={`deploy-result ${deployResult.success ? 'success' : 'error'}`}>
          <h4>Deployment Result:</h4>
          {deployResult.success ? (
            <div>
              <p><strong>Contract Address:</strong> {deployResult.result?.address}</p>
              <p><strong>Transaction Hash:</strong> {deployResult.result?.transactionHash}</p>
            </div>
          ) : (
            <p className="error-message">{deployResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
