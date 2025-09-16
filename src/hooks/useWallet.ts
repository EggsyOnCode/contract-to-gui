import { useState, useEffect, useCallback } from 'react';
import { WalletManager } from '../utils/wallet';
import { WalletState } from '../types';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
  });
  const [walletManager] = useState(() => new WalletManager());
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const state = await walletManager.connectWallet();
      setWalletState(state);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [walletManager]);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletManager.disconnectWallet();
      setWalletState({ isConnected: false });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [walletManager]);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      await walletManager.switchNetwork(chainId);
      const state = walletManager.getWalletState();
      setWalletState(state);
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert(error instanceof Error ? error.message : 'Failed to switch network');
    }
  }, [walletManager]);

  useEffect(() => {
    // Check if wallet is already connected on page load
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const state = await walletManager.connectWallet();
            setWalletState(state);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, [walletManager]);

  return {
    walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnecting,
    walletManager,
  };
};
