import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/home';
import Home from './pages/dashboard/home';
import Mining from './pages/dashboard/mining';
import Wallet from './pages/dashboard/wallet';
import GameLibrary from './pages/dashboard/library';
import GamePlay from './pages/dashboard/play';
import LiveStream from './pages/dashboard/stream';
import Profile from './pages/dashboard/profile';
import Social from './pages/dashboard/social';
import History from './pages/dashboard/history';
import WatchEarn from './pages/dashboard/watch-earn';
import More from './pages/dashboard/more';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import OtpPage from './pages/auth/otp';
import TokenPage from './pages/dashboard/token';
import FAQ from './pages/dashboard/faq';
import Leaderboard from './pages/dashboard/leaderboard';
import Refer from './pages/dashboard/refer';
import DisputePage from './pages/dashboard/disputes';
import PostPage from './pages/dashboard/post';
import MessagesPage from './pages/dashboard/messages';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify" element={<OtpPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/play" element={<GamePlay />} />
        <Route path="/stream" element={<LiveStream />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/library" element={<GameLibrary />} />
          <Route path="/mining" element={<Mining />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/social" element={<Social />} />
          <Route path="/messages/:userId" element={<MessagesPage />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/watch-earn" element={<WatchEarn />} />
          <Route path="/more" element={<More />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/token" element={<TokenPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/disputes/:matchId" element={<DisputePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
