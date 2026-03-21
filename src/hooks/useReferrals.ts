import { useEffect, useState } from 'react';
import { api } from '../api/axios';

export type ReferralSummary = {
  referralCode: string;
  referralLink: string;
  referrals: Array<{
    _id: string;
    status: 'signed_up' | 'rewarded';
    rewardIgc: number;
    createdAt?: string;
    referredUserId?: {
      _id: string;
      fullName: string;
      username: string;
      email: string;
    };
  }>;
  totalReferrals: number;
  totalRewardedIgc: number;
};

export function useReferrals(autoLoad = true) {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ReferralSummary>('/referrals/me');
      setSummary(data);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch referrals';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      void fetchReferrals();
    }
  }, [autoLoad]);

  return {
    summary,
    loading,
    error,
    fetchReferrals,
  };
}
