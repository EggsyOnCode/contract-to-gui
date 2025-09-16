import React, { useState } from 'react';
import { ContractFunction, ContractCallResult } from '../types';

interface ContractFunctionsProps {
  functions: ContractFunction[];
  onCallFunction: (functionName: string, args: any[], value?: string) => Promise<ContractCallResult>;
  isReadOnly?: boolean;
}

export const ContractFunctions: React.FC<ContractFunctionsProps> = ({
  functions,
  onCallFunction,
  isReadOnly = false,
}) => {
  const [functionStates, setFunctionStates] = useState<Record<string, any>>({});
  const [callResults, setCallResults] = useState<Record<string, ContractCallResult>>({});
  const [isCalling, setIsCalling] = useState<Record<string, boolean>>({});

  const getInputType = (input: any) => {
    switch (input.type) {
      case 'bool':
        return 'checkbox';
      case 'uint8':
      case 'uint16':
      case 'uint32':
      case 'uint64':
      case 'uint128':
      case 'uint256':
      case 'int8':
      case 'int16':
      case 'int32':
      case 'int64':
      case 'int128':
      case 'int256':
        return 'number';
      case 'address':
        return 'text';
      case 'bytes':
      case 'string':
        return 'text';
      default:
        return 'text';
    }
  };

  const handleInputChange = (functionName: string, inputIndex: number | string, value: any) => {
    setFunctionStates(prev => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [inputIndex]: value,
      },
    }));
  };

  const handleCallFunction = async (func: ContractFunction) => {
    const functionName = func.name;
    setIsCalling(prev => ({ ...prev, [functionName]: true }));

    try {
      const args = func.inputs.map((_, index) => {
        const value = functionStates[functionName]?.[index];
        if (value === undefined || value === '') return null;
        
        // Type conversion based on input type
        if (func.inputs[index].type === 'bool') {
          return Boolean(value);
        } else if (func.inputs[index].type.startsWith('uint') || func.inputs[index].type.startsWith('int')) {
          return parseInt(value) || 0;
        }
        return value;
      });

      const value = functionStates[functionName]?.value || undefined;
      const result = await onCallFunction(functionName, args, value);
      
      setCallResults(prev => ({
        ...prev,
        [functionName]: result,
      }));
    } catch (error) {
      setCallResults(prev => ({
        ...prev,
        [functionName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setIsCalling(prev => ({ ...prev, [functionName]: false }));
    }
  };

  const getStateMutabilityColor = (mutability: string) => {
    switch (mutability) {
      case 'view':
      case 'pure':
        return 'read-function';
      case 'nonpayable':
        return 'write-function';
      case 'payable':
        return 'payable-function';
      default:
        return 'default-function';
    }
  };

  return (
    <div className="contract-functions">
      <h3>{isReadOnly ? 'Read Functions' : 'Contract Functions'}</h3>
      {functions.length === 0 ? (
        <p className="no-functions">No functions available</p>
      ) : (
        <div className="functions-list">
          {functions.map((func) => (
            <div key={func.name} className={`function-card ${getStateMutabilityColor(func.stateMutability)}`}>
              <div className="function-header">
                <h4>{func.name}</h4>
                <span className="function-type">{func.stateMutability}</span>
              </div>
              
              {func.inputs.length > 0 && (
                <div className="function-inputs">
                  <h5>Inputs:</h5>
                  {func.inputs.map((input, index) => (
                    <div key={index} className="input-group">
                      <label htmlFor={`${func.name}-${index}`}>
                        {input.name} ({input.type})
                      </label>
                      <input
                        id={`${func.name}-${index}`}
                        type={getInputType(input)}
                        placeholder={`Enter ${input.name}`}
                        value={functionStates[func.name]?.[index] || ''}
                        onChange={(e) => {
                          const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                          handleInputChange(func.name, index, value);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {func.stateMutability === 'payable' && (
                <div className="function-value">
                  <label htmlFor={`${func.name}-value`}>Value (ETH):</label>
                  <input
                    id={`${func.name}-value`}
                    type="number"
                    step="0.000000000000000001"
                    placeholder="0.0"
                    value={functionStates[func.name]?.value || ''}
                    onChange={(e) => handleInputChange(func.name, 'value', e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={() => handleCallFunction(func)}
                disabled={isCalling[func.name]}
                className="call-button"
              >
                {isCalling[func.name] ? 'Calling...' : 'Call Function'}
              </button>

              {callResults[func.name] && (
                <div className={`call-result ${callResults[func.name].success ? 'success' : 'error'}`}>
                  <h5>Result:</h5>
                  {callResults[func.name].success ? (
                    <pre>{JSON.stringify(callResults[func.name].result, null, 2)}</pre>
                  ) : (
                    <p className="error-message">{callResults[func.name].error}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
