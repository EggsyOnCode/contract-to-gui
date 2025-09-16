import React from 'react';
import { WalletState } from '../types';

interface WalletConnectorProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  walletState,
  onConnect,
  onDisconnect,
  isConnecting,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connector">
      <h3>Wallet Connection</h3>
      {walletState.isConnected ? (
        <div className="wallet-connected">
          <div className="wallet-info">
            <div className="wallet-address">
              <strong>Address:</strong> {formatAddress(walletState.address || '')}
            </div>
            {walletState.chainId && (
              <div className="wallet-chain">
                <strong>Chain ID:</strong> {walletState.chainId}
              </div>
            )}
          </div>
          <button onClick={onDisconnect} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      ) : (
        <div className="wallet-disconnected">
          <button 
            onClick={onConnect} 
            disabled={isConnecting}
            className="connect-btn"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <p className="wallet-help">
            Connect your Web3 wallet to interact with smart contracts
          </p>
        </div>
      )}
    </div>
  );
};
