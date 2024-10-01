import { ethers } from 'ethers';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WalletType } from './types';

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  balanceUsd: number;
}

export interface WalletBalance {
  totalBalanceUsd: number;
  tokens: TokenBalance[];
  lastUpdated: number;
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
];

const ETH_TOKENS: TokenInfo[] = [
  { symbol: 'ETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 }, // Wrapped ETH
  { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  { symbol: 'STETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', decimals: 18 },
  { symbol: 'WBETH', address: '0xa2E3356610840701BDf5611a53974510Ae27E2e1', decimals: 18 },
  { symbol: 'METH', address: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa', decimals: 18 },
  { symbol: 'CBETH', address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', decimals: 18 },
  { symbol: 'rsETH', address: '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7', decimals: 18 },
  { symbol: 'pufETH', address: '0xD9A442856C234a39a81a089C06451EBAa4306a72', decimals: 18 },
];

export function detectWallets(): WalletType[] {
  const wallets: WalletType[] = [];

  if (typeof window !== 'undefined') {
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) {
        wallets.push('MetaMask');
      }
      if (window.ethereum.isTrust) {
        wallets.push('Trust Wallet');
      }
    }
    if (window.solana && window.solana.isPhantom) {
      wallets.push('Phantom');
    }
  }

  return wallets;
}

export async function connectWallet(walletType: WalletType): Promise<string | null> {
  switch (walletType) {
    case 'MetaMask':
    case 'Trust Wallet':
      if (window.ethereum) {
        try {
          let accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          }
          return accounts[0];
        } catch (error: any) {
          console.error('Error connecting to Ethereum wallet:', error);
          if (error.code === 4001) {
            throw new Error('User rejected the connection request');
          } else if (error.code === -32002) {
            throw new Error('Connection request already pending. Please check your wallet.');
          } else {
            throw new Error(`Failed to connect to Ethereum wallet: ${error.message || 'Unknown error'}`);
          }
        }
      } else {
        throw new Error('Ethereum provider not found. Is your wallet extension installed?');
      }
    case 'Phantom':
      if (window.solana) {
        try {
          const { publicKey } = await window.solana.connect();
          return publicKey.toString();
        } catch (error: any) {
          console.error('Error connecting to Phantom wallet:', error);
          throw new Error(`Failed to connect to Phantom wallet: ${error.message || 'Unknown error'}`);
        }
      } else {
        throw new Error('Solana provider not found. Is Phantom wallet installed?');
      }
    default:
      throw new Error('Unsupported wallet type');
  }
}

export async function getWalletAddress(): Promise<string | null> {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (error) {
      console.error('Error getting Ethereum wallet address:', error);
      return null;
    }
  } else if (window.solana && window.solana.isPhantom) {
    try {
      const publicKey = await window.solana.connect({ onlyIfTrusted: true });
      return publicKey.toString();
    } catch (error) {
      console.error('Error getting Phantom wallet address:', error);
      return null;
    }
  }
  return null;
}

export async function isOnSupportedNetwork(): Promise<boolean> {
  if (window.ethereum) {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const supportedChainIds = ['0x1', '0x3', '0x4', '0x5']; // Example: Mainnet, Ropsten, Rinkeby, Goerli
      return supportedChainIds.includes(chainId);
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  } else if (window.solana && window.solana.isPhantom) {
    return true;
  }
  return false;
}

export function listenForAccountChanges(callback: (accounts: string[]) => void) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
}

export async function disconnectWallet(): Promise<void> {
  if (window.ethereum) {
    console.log('Disconnecting Ethereum wallet');
  } else if (window.solana && window.solana.isPhantom) {
    console.log('Disconnecting Phantom wallet');
    await window.solana.disconnect();
  }
}

async function fetchTokenBalances(provider: ethers.JsonRpcProvider, tokens: TokenInfo[], walletAddress: string): Promise<TokenBalance[]> {
  const balances = await Promise.all(tokens.map(async (token) => {
    try {
      console.log(`Fetching balance for ${token.symbol} at address ${token.address}`);
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      const formattedBalance = ethers.formatUnits(balance, token.decimals);
      console.log(`Raw balance for ${token.symbol}: ${balance.toString()}`);
      console.log(`Formatted balance for ${token.symbol}: ${formattedBalance}`);
      return {
        symbol: token.symbol,
        balance: formattedBalance,
        balanceUsd: 0 // Will be updated with ETH price later
      };
    } catch (error) {
      console.error(`Error fetching balance for ${token.symbol}:`, error);
      return {
        symbol: token.symbol,
        balance: '0',
        balanceUsd: 0
      };
    }
  }));

  // Log all balances before filtering
  console.log('All token balances:', balances);

  // Filter out zero balances, but log which ones are being removed
  const nonZeroBalances = balances.filter(token => {
    const isNonZero = parseFloat(token.balance) > 0;
    if (!isNonZero) {
      console.log(`Filtering out ${token.symbol} due to zero balance`);
    }
    return isNonZero;
  });

  console.log('Non-zero balances:', nonZeroBalances);

  return nonZeroBalances;
}

async function getCachedBalance(address: string): Promise<WalletBalance | null> {
  const docRef = doc(db, 'walletBalances', address);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as WalletBalance;
    if (Date.now() - data.lastUpdated < CACHE_EXPIRY) {
      return data;
    }
  }
  return null;
}

async function setCachedBalance(address: string, balance: WalletBalance): Promise<void> {
  const docRef = doc(db, 'walletBalances', address);
  await setDoc(docRef, balance);
}

const CHAINLINK_ETH_USD_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
const CHAINLINK_FEED_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

async function getEthPrice(provider: ethers.JsonRpcProvider): Promise<number> {
  const priceFeed = new ethers.Contract(CHAINLINK_ETH_USD_FEED, CHAINLINK_FEED_ABI, provider);
  const [, answer] = await priceFeed.latestRoundData();
  return Number(ethers.formatUnits(answer, 8)); // Chainlink uses 8 decimals for USD price
}

export async function fetchWalletBalance(address: string | null): Promise<WalletBalance> {
  try {
    if (!INFURA_API_KEY) {
      throw new Error('INFURA_API_KEY is not set');
    }
    if (!address) {
      throw new Error('Wallet address is null or undefined');
    }

    const cachedBalance = await getCachedBalance(address);
    if (cachedBalance) {
      return cachedBalance;
    }

    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
    const ethBalance = await provider.getBalance(address);
    const ethBalanceEther = ethers.formatEther(ethBalance);

    console.log('Fetching token balances...');
    const tokenBalances = await fetchTokenBalances(provider, ETH_TOKENS, address);
    console.log('Token balances:', tokenBalances);

    // Fetch current ETH price
    const ethPrice = await getEthPrice(provider);
    console.log('Current ETH price:', ethPrice);

    let totalBalanceUsd = 0;
    const updatedBalances = tokenBalances.map(token => {
      const balanceUsd = parseFloat(token.balance) * ethPrice;
      totalBalanceUsd += balanceUsd;
      return { ...token, balanceUsd };
    });

    console.log('Updated balances:', updatedBalances);

    // Add ETH balance
    const ethBalanceUsd = parseFloat(ethBalanceEther) * ethPrice;
    totalBalanceUsd += ethBalanceUsd;
    updatedBalances.unshift({ symbol: 'ETH', balance: ethBalanceEther, balanceUsd: ethBalanceUsd });

    const walletBalance: WalletBalance = {
      totalBalanceUsd,
      tokens: updatedBalances.filter(token => parseFloat(token.balance) > 0),
      lastUpdated: Date.now()
    };

    console.log('Final wallet balance:', walletBalance);

    await setCachedBalance(address, walletBalance);

    return walletBalance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return { totalBalanceUsd: 0, tokens: [], lastUpdated: Date.now() };
  }
}

export async function updateUserWalletBalance(userId: string, walletAddress: string): Promise<void> {
  try {
    const walletBalance = await fetchWalletBalance(walletAddress);
    await updateDoc(doc(db, 'users', userId), {
      walletBalanceUsd: walletBalance.totalBalanceUsd,
      tokenBalances: walletBalance.tokens
    });
  } catch (error) {
    console.error('Error updating user wallet balance:', error);
  }
}