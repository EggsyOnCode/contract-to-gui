import { BrowserProvider, JsonRpcSigner } from '@armchain-ethersv6/ethers';
import { WalletState } from '../types';

export class WalletManager {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private walletState: WalletState = {
    isConnected: false,
  };

  async connectWallet(): Promise<WalletState> {
    try {
      if (typeof window.wigwamEthereum === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      this.provider = new BrowserProvider(window.wigwamEthereum);
      const accounts = await window.wigwamEthereum.request({
        method: 'eth_requestAccounts',
      });

      console.log(accounts);

      // await this.provider.send('eth_requestAccounts', []);
      
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();

      this.walletState = {
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        provider: this.provider,
        signer: this.signer,
      };

      return this.walletState;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.walletState = {
      isConnected: false,
    };
  }

  getWalletState(): WalletState {
    return this.walletState;
  }

  getProvider(): BrowserProvider | null {
    return this.provider;
  }

  getSigner(): JsonRpcSigner | null {
    return this.signer;
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
    } catch (error) {
      throw new Error(`Failed to switch network: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
