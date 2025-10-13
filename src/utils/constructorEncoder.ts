import { ethers } from '@armchain-ethersv6/ethers';
import { ContractABI } from '../types';

/**
 * Encodes constructor arguments for a smart contract
 * @param contractABI - The contract ABI containing constructor information
 * @param constructorArgs - Array of constructor argument values
 * @returns Encoded constructor arguments as hex string
 */
export function encodeConstructorArgs(contractABI: ContractABI, constructorArgs: any[]): string {
  try {
    // Get constructor from ABI
    const constructor = contractABI.abi.find(item => item.type === 'constructor');
    
    if (!constructor) {
      throw new Error('No constructor found in contract ABI');
    }

    // Get constructor input types
    const inputTypes = constructor.inputs.map(input => input.type);
    
    // Validate that we have the right number of arguments
    if (constructorArgs.length !== inputTypes.length) {
      throw new Error(
        `Expected ${inputTypes.length} constructor arguments, got ${constructorArgs.length}`
      );
    }

    // Convert constructor args to proper types
    const typedArgs = constructorArgs.map((arg, index) => {
      const inputType = inputTypes[index];
      return convertToType(arg, inputType);
    });

    // Encode the arguments
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(inputTypes, typedArgs);
    
    return encoded;
  } catch (error) {
    console.error('Error encoding constructor arguments:', error);
    throw new Error(`Failed to encode constructor arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a value to the appropriate type for ABI encoding
 * @param value - The value to convert
 * @param type - The target type
 * @returns The converted value
 */
function convertToType(value: any, type: string): any {
  if (value === null || value === undefined || value === '') {
    throw new Error(`Value cannot be null, undefined, or empty for type ${type}`);
  }

  // Handle string types
  if (type === 'string') {
    return String(value);
  }

  // Handle address types
  if (type === 'address') {
    const address = String(value);
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }
    return address;
  }

  // Handle boolean types
  if (type === 'bool') {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0') {
        return false;
      }
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    throw new Error(`Cannot convert "${value}" to boolean`);
  }

  // Handle integer types
  if (type.startsWith('uint') || type.startsWith('int')) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`Cannot convert "${value}" to number for type ${type}`);
    }
    
    // Check for overflow based on bit size
    const bitSize = parseInt(type.replace(/uint|int/, ''));
    if (bitSize) {
      const maxValue = type.startsWith('uint') 
        ? Math.pow(2, bitSize) - 1
        : Math.pow(2, bitSize - 1) - 1;
      const minValue = type.startsWith('uint') 
        ? 0
        : -Math.pow(2, bitSize - 1);
      
      if (numValue > maxValue || numValue < minValue) {
        throw new Error(`Value ${numValue} out of range for ${type} (${minValue} to ${maxValue})`);
      }
    }
    
    return Math.floor(numValue);
  }

  // Handle bytes types
  if (type.startsWith('bytes')) {
    if (type === 'bytes') {
      // Dynamic bytes
      if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          return value;
        }
        return ethers.toUtf8Bytes(value);
      }
      throw new Error(`Cannot convert "${value}" to bytes`);
    } else {
      // Fixed-size bytes
      const size = parseInt(type.replace('bytes', ''));
      if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          const hex = value.slice(2);
          if (hex.length !== size * 2) {
            throw new Error(`Hex string length must be ${size * 2} for ${type}`);
          }
          return value;
        }
        const bytes = ethers.toUtf8Bytes(value);
        if (bytes.length > size) {
          throw new Error(`String too long for ${type}`);
        }
        return ethers.hexlify(bytes);
      }
      throw new Error(`Cannot convert "${value}" to ${type}`);
    }
  }

  // Handle array types
  if (type.includes('[]')) {
    if (!Array.isArray(value)) {
      throw new Error(`Expected array for type ${type}`);
    }
    const elementType = type.replace('[]', '');
    return value.map(item => convertToType(item, elementType));
  }

  // Default: return as string
  return String(value);
}

/**
 * Gets constructor input types from a contract ABI
 * @param contractABI - The contract ABI
 * @returns Array of constructor input types
 */
export function getConstructorTypes(contractABI: ContractABI): string[] {
  const constructor = contractABI.abi.find(item => item.type === 'constructor');
  return constructor?.inputs?.map(input => input.type) || [];
}

/**
 * Validates constructor arguments against the contract ABI
 * @param contractABI - The contract ABI
 * @param constructorArgs - Array of constructor argument values
 * @returns True if valid, throws error if invalid
 */
export function validateConstructorArgs(contractABI: ContractABI, constructorArgs: any[]): boolean {
  const constructor = contractABI.abi.find(item => item.type === 'constructor');
  
  if (!constructor) {
    throw new Error('No constructor found in contract ABI');
  }

  const inputTypes = constructor.inputs.map(input => input.type);
  
  if (constructorArgs.length !== inputTypes.length) {
    throw new Error(
      `Expected ${inputTypes.length} constructor arguments, got ${constructorArgs.length}`
    );
  }

  // Try to convert each argument to validate types
  constructorArgs.forEach((arg, index) => {
    const inputType = inputTypes[index];
    convertToType(arg, inputType);
  });

  return true;
} 