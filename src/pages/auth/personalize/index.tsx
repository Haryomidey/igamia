import React, { useEffect, useMemo, useState } from 'react';
import { Gamepad2, MapPin, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/ToastProvider';
import { useAuth } from '../../../hooks/useAuth';
import { useGames } from '../../../hooks/useGames';
import { needsOnboarding } from '../../../lib/profile';

const FALLBACK_INTERESTS = [
  'Mortal Kombat',
  'Football',
  'Soccer',
  'Tennis',
  'FPS',
  'RPG',
  'Racing',
  'Strategy',
];

export default function PersonalizePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const auth = useAuth();
  const { games } = useGames();

  const [location, setLocation] = useState('');
  const [age, setAge] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!auth.user) {
      return;
    }

    setLocation(auth.user.location ?? '');
    setAge(auth.user.age ? String(auth.user.age) : '');
    setSelectedInterests(auth.user.gameInterests ?? []);
  }, [auth.user]);

  const interestOptions = useMemo(() => {
    const gameTitles = games.map((game) => game.title).filter(Boolean);
    const options = [...gameTitles, ...FALLBACK_INTERESTS];
    return Array.from(new Set(options)).slice(0, 8);
  }, [games]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => (
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length >= 8
          ? current
          : [...current, interest]
    ));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericAge = Number(age);

    if (!location.trim()) {
      toast.warning('Add your location to continue.');
      return;
    }

    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
      toast.warning('Enter a valid age between 13 and 120.');
      return;
    }

    if (!selectedInterests.length) {
      toast.warning('Choose at least one game interest.');
      return;
    }

    try {
      await auth.updateProfile({
        location: location.trim(),
        age: numericAge,
        gameInterests: selectedInterests,
      });
      toast.success('Your profile is ready.');
      navigate('/home', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to finish setup.');
    }
  };

  if (!auth.loading && !auth.user) {
    return <Navigate to="/login" replace />;
  }

  if (auth.user && !needsOnboarding(auth.user)) {
    return <Navigate to="/home" replace />;
  }

  if (auth.loading || !auth.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0a1f] px-6 text-zinc-300">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6 text-sm">
          Loading your setup...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0e0a1f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative flex items-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(157,124,240,0.16),transparent_38%),linear-gradient(180deg,#120d2d_0%,#0c0920_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary shadow-lg shadow-brand-primary/30">
                <Gamepad2 size={22} />
              </div>
              <span className="text-2xl font-black uppercase italic tracking-tight">iGamia</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-14"
            >
              <h1 className="text-4xl font-black uppercase italic tracking-tight sm:text-6xl">Personalize</h1>
              <p className="mt-4 max-w-md text-sm text-zinc-400 sm:text-base">
                Tell us a bit more about your gaming style.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                      <MapPin size={14} />
                      Location
                    </span>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="e.g. London, UK"
                      className="w-full rounded-[1.35rem] border border-white/12 bg-white/5 px-5 py-4 text-lg text-white outline-none transition focus:border-brand-primary/50 focus:bg-white/[0.07]"
                    />
                  </label>

                  <label className="space-y-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                      <CalendarDays size={14} />
                      Age
                    </span>
                    <input
                      type="number"
                      min={13}
                      max={120}
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      placeholder="21"
                      className="w-full rounded-[1.35rem] border border-white/12 bg-white/5 px-5 py-4 text-lg text-white outline-none transition focus:border-brand-primary/50 focus:bg-white/[0.07]"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Game Interests
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {interestOptions.map((interest, index) => {
                      const active = selectedInterests.includes(interest);

                      return (
                        <motion.button
                          key={interest}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.25 }}
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                            active
                              ? 'border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                              : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {interest}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={auth.submitting}
                  className="w-full rounded-[1.6rem] bg-brand-primary px-6 py-5 text-sm font-black uppercase tracking-[0.28em] text-white shadow-[0_20px_60px_rgba(157,124,240,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {auth.submitting ? 'Saving Setup...' : 'Finish Setup'}
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        <aside className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80"
            alt="Flowers"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,10,31,0.94)_0%,rgba(14,10,31,0.72)_24%,rgba(14,10,31,0.2)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(240,180,41,0.2),transparent_25%),radial-gradient(circle_at_72%_60%,rgba(234,89,144,0.22),transparent_24%)]" />
        </aside>
      </div>
    </div>
  );
}
