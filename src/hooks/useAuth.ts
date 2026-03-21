import { useEffect, useState } from 'react';
import { api, clearAccessToken, getAccessToken, setAccessToken } from '../api/axios';

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  emailVerified: boolean;
  referralCode: string;
  avatarUrl: string;
  bio: string;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  referralCode?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    void fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AuthUser>('/users/me');
      setUser(data);
      setError(null);
      return data;
    } catch (err: any) {
      clearAccessToken();
      setUser(null);
      setError(err?.response?.data?.message ?? 'Unable to load user');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to register';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to login';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmail = async (payload: { email: string; otp: string }) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<AuthResponse & { message: string }>(
        '/auth/verify-email',
        payload,
      );
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to verify OTP';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async (email: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/resend-verification', null, {
        params: { email },
      });
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to resend verification';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to start password reset';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (payload: {
    email: string;
    otp: string;
    newPassword: string;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to reset password';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    clearAccessToken();
    setUser(null);
  };

  return {
    user,
    loading,
    submitting,
    error,
    isAuthenticated: Boolean(user),
    fetchMe,
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
  };
}
