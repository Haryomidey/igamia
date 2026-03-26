import { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/axios';

export type WalletSnapshot = {
  wallet: {
    _id: string;
    userId: string;
    usdBalance: number;
    igcBalance: number;
  };
  transactions: Array<{
    _id: string;
    type: string;
    amount: number;
    currency: 'USD' | 'IGC';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    createdAt?: string;
  }>;
};

export function useWallet(autoLoad = true) {
  const [walletData, setWalletData] = useState<WalletSnapshot | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!getAccessToken()) {
      setWalletData(null);
      setError(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const { data } = await api.get<WalletSnapshot>('/wallet/me');
      setWalletData(data);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch wallet';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (amount: number) => {
    const { data } = await api.post('/wallet/withdraw', { amount });
    await fetchWallet();
    return data;
  };

  const gift = async (payload: {
    receiverUserId: string;
    amount: number;
    description: string;
  }) => {
    const { data } = await api.post('/wallet/gift', payload);
    await fetchWallet();
    return data;
  };

  const initializePayment = async (payload: {
    amount: number;
    email: string;
    purpose: string;
  }) => {
    const { data } = await api.post('/payments/paystack/initialize', payload);
    return data;
  };

  const verifyPayment = async (reference: string) => {
    const { data } = await api.get('/payments/paystack/callback', {
      params: { reference },
    });
    await fetchWallet();
    return data;
  };

  useEffect(() => {
    if (autoLoad) {
      void fetchWallet();
    }
  }, [autoLoad]);

  return {
    walletData,
    loading,
    error,
    fetchWallet,
    withdraw,
    gift,
    initializePayment,
    verifyPayment,
  };
}
