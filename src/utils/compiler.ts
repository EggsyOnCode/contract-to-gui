import { ContractABI, CompilerSettings } from '../types';

// Global variable to store the loaded solc instance
let solcInstance: any = null;

const loadSolcFromCDN = async (version: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (solcInstance && solcInstance.version() === version) {
      resolve(solcInstance);
      return;
    }

    // Create script element to load solc from CDN
    const script = document.createElement('script');
    script.src = `https://binaries.soliditylang.org/bin/soljson-${version}.js`;
    script.async = true;
    
    script.onload = () => {
      try {
        // @ts-ignore - solc will be available globally after script loads
        const Solc = (window as any).Module;
        if (Solc) {
          solcInstance = Solc;
          resolve(Solc);
        } else {
          reject(new Error('Failed to initialize solc'));
        }
      } catch (error) {
        reject(new Error(`Failed to initialize solc: ${error}`));
      }
    };
    
    script.onerror = () => {
      reject(new Error(`Failed to load solc version ${version} from CDN`));
    };
    
    document.head.appendChild(script);
  });
};

export class ContractCompiler {
  async compileContract(
    sourceCode: string,
    contractName: string,
    settings: CompilerSettings
  ): Promise<ContractABI> {
    try {
      const solc = await loadSolcFromCDN(settings.solcVersion);
      
      const input = {
        language: 'Solidity',
        sources: {
          [contractName]: {
            content: sourceCode,
          },
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*'],
            },
          },
          evmVersion: settings.evmVersion,
          optimizer: {
            enabled: settings.optimization,
            runs: settings.runs || 200,
          },
        },
      };

      const output = JSON.parse(
        solc.compile(JSON.stringify(input))
      );

      if (output.errors) {
        const errors = output.errors.filter((error: any) => error.severity === 'error');
        if (errors.length > 0) {
          throw new Error(`Compilation failed: ${errors.map((e: any) => e.message).join('\n')}`);
        }
      }

      const contract = output.contracts[contractName][contractName];
      if (!contract) {
        throw new Error(`Contract ${contractName} not found in compilation output`);
      }

      return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        contractName,
      };
    } catch (error) {
      throw new Error(`Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAvailableSolcVersions(): string[] {
    return [
      '0.8.30',
      '0.8.29',
      '0.8.28',
      '0.8.27',
      '0.8.26',
      '0.8.25',
      '0.8.24',
      '0.8.23',
      '0.8.22',
      '0.8.21',
      '0.8.20',
      '0.8.19',
      '0.8.18',
      '0.8.17',
      '0.8.16',
      '0.8.15',
      '0.8.14',
      '0.8.13',
      '0.8.12',
      '0.8.11',
      '0.8.10',
      '0.8.9',
      '0.8.8',
      '0.8.7',
      '0.8.6',
      '0.8.5',
      '0.8.4',
      '0.8.3',
      '0.8.2',
      '0.8.1',
      '0.8.0',
    ];
  }

  getAvailableEVMVersions(): string[] {
    return [
      'shanghai',
      'paris',
      'london',
      'berlin',
      'istanbul',
      'petersburg',
      'constantinople',
      'byzantium',
      'spuriousDragon',
      'tangerineWhistle',
      'homestead',
      'frontier',
    ];
  }
}
