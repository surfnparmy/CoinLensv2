import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type WalletType = 'MetaMask' | 'TrustWallet' | 'Phantom' | null;

interface WalletState {
  account: string | null;
  balance: string | null;
  walletType: WalletType;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(() => {
    if (typeof window !== 'undefined') {
      const savedWalletState = localStorage.getItem('walletState');
      return savedWalletState ? JSON.parse(savedWalletState) : { account: null, balance: null, walletType: null };
    }
    return { account: null, balance: null, walletType: null };
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const detectWallets = () => {
    const hasMetaMask = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    const hasTrustWallet = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isTrust;
    const hasPhantom = typeof window !== 'undefined' && typeof window.solana !== 'undefined' && window.solana.isPhantom;

    return { hasMetaMask, hasTrustWallet, hasPhantom };
  };

  const connectWallet = async (walletType: WalletType) => {
    setLoading(true);
    setError(null);

    try {
      let account: string;
      let balance: string;

      if (walletType === 'MetaMask' || walletType === 'TrustWallet') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        account = accounts[0];
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceWei = await provider.getBalance(account);
        balance = ethers.formatEther(balanceWei);

        // Sign a message to verify ownership of the address
        const signer = await provider.getSigner();
        const message = `Sign this message to verify your identity: ${Date.now()}`;
        const signature = await signer.signMessage(message);

        // Verify the signature on the server
        await verifySignature(account, message, signature);
      } else if (walletType === 'Phantom') {
        const resp = await window.solana.connect();
        account = resp.publicKey.toString();
        balance = await getPhantomBalance(account);

        // For Phantom, you might need a different signature verification process
        // This is a placeholder and should be implemented according to Phantom's API
        const message = `Sign this message to verify your identity: ${Date.now()}`;
        const encodedMessage = new TextEncoder().encode(message);
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");

        // Verify the signature on the server
        await verifyPhantomSignature(account, message, signedMessage);
      } else {
        throw new Error('Unsupported wallet type');
      }

      await updateUserDocument(account, balance, walletType);

      setWalletState({ account, balance, walletType });
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserDocument = async (account: string, balance: string, walletType: WalletType) => {
    const userDocRef = doc(db, 'users', account);
    await setDoc(userDocRef, {
      walletAddress: account,
      balance: balance,
      walletType: walletType,
    }, { merge: true });
  };

  const verifySignature = async (address: string, message: string, signature: string) => {
    const response = await fetch('/api/auth/verifySignature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, message, signature }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify signature');
    }

    const { verified } = await response.json();
    if (!verified) {
      throw new Error('Signature verification failed');
    }
  };

  const verifyPhantomSignature = async (publicKey: string, message: string, signedMessage: Uint8Array) => {
    const response = await fetch('/api/auth/verifyPhantomSignature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicKey, message, signedMessage: Array.from(signedMessage) }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify Phantom signature');
    }

    const { verified } = await response.json();
    if (!verified) {
      throw new Error('Phantom signature verification failed');
    }
  };

  const getPhantomBalance = async (publicKey: string): Promise<string> => {
    try {
      const connection = new window.solana.Connection("https://api.mainnet-beta.solana.com");
      const balance = await connection.getBalance(new window.solana.PublicKey(publicKey));
      return (balance / 1e9).toString(); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching Phantom balance:', error);
      return '0';
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      account: null,
      balance: null,
      walletType: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletState');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletState', JSON.stringify(walletState));
    }
  }, [walletState]);

  return { walletState, error, loading, connectWallet, detectWallets, disconnectWallet };
}