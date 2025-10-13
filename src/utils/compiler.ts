import { ContractABI, CompilerSettings } from '../types';
import { fetchAndLoadSolc } from 'web-solc';

export class ContractCompiler {
  private solc: any | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private cachedSolcBuilds: any[] | null = null;
  private cachedAllVersions: string[] | null = null;
  private cachedStableVersions: string[] | null = null;

  constructor() {
    // Don't load immediately, wait for first compilation
  }

  private async loadSolc(version: string): Promise<void> {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      if (this.solc && !this.isLoading) {
        return;
      }

      if (this.isLoading) {
        // Wait for current loading to complete
        while (this.isLoading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return;
      }

      this.isLoading = true;
      
      try {
        console.log(`Loading Solidity compiler version: ${version}`);
        this.solc = await fetchAndLoadSolc(version);
        console.log('Solidity compiler loaded successfully');
      } catch (error) {
        console.error('Failed to load Solidity compiler:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  async compileContract(
    sourceCode: string,
    contractName: string,
    settings: CompilerSettings
  ): Promise<ContractABI> {
    try {
      console.log('Loading Solidity compiler...');
      await this.loadSolc(settings.solcVersion);
      console.log('Compiler loaded, compiling...');
      
      if (!this.solc) {
        throw new Error('Compiler not loaded');
      }

      let runs = settings.optimization ? 200 : 0;

      const input = {
        language: 'Solidity',
        sources: {
          [contractName]: {
            content: sourceCode,
          },
        },
        settings: {
          outputSelection: {
          "*": {
                "*": [
                  "abi",
                  "evm.bytecode.object",        // creation code (for deployment)
                  "evm.deployedBytecode.object" // runtime code (for verification)
                ],
              },
          },
          viaIR: false,
          evmVersion: settings.evmVersion,
          optimizer: {
            enabled: settings.optimization,
            runs: runs,
          },
        },
      };

      console.log("inputs", input);
      

      const output = await this.solc.compile(input);
      console.log('Compilation output:', output);

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

      console.log('Compilation successful!');
      return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        contractName,
      };
    } catch (error) {
      console.error('Compilation error:', error);
      throw new Error(`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Solidity code and try again.`);
    }
  }

  // Remote versions (solc-bin). Returns cached when available.
  async fetchSolcVersions(): Promise<{ builds: any[]; allVersions: string[]; stableVersions: string[] }> {
    if (this.cachedSolcBuilds && this.cachedAllVersions && this.cachedStableVersions) {
      return {
        builds: this.cachedSolcBuilds,
        allVersions: this.cachedAllVersions,
        stableVersions: this.cachedStableVersions,
      };
    }

    const response = await fetch('https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/list.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch solc versions: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const builds: any[] = Array.isArray(data?.builds) ? data.builds : [];

    // e.g., build.longVersion -> "0.8.30+commit.abc123" → display as `v0.8.30+commit.abc123`
    const allVersions: string[] = [];
    const stableVersions: string[] = [];

    builds.forEach((build: any) => {
      const version = `v${build.longVersion}`;
      // unshift to keep latest first
      allVersions.unshift(version);
      if (!build.prerelease) {
        stableVersions.unshift(version);
      }
    });

    this.cachedSolcBuilds = builds;
    this.cachedAllVersions = allVersions;
    this.cachedStableVersions = stableVersions;

    return { builds, allVersions, stableVersions };
  }

  // Backward-compatible static list (fallback)
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

  // Clean up resources when done
  cleanup(): void {
    if (this.solc) {
      this.solc.stopWorker();
      this.solc = null;
    }
  }
}
