import React, { useEffect, useState } from 'react';
import { ChevronLeft, Users, Share2, MessageSquare, Send, Maximize2, Volume2, Settings, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGames, type Game } from '../../../hooks/useGames';

export default function GamePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');

  const { featuredGames, fetchGame } = useGames({ featured: true });
  const [game, setGame] = useState<Game | null>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { id: 1, user: 'ArenaBot', text: 'Welcome to the match lobby.', color: '#9d7cf0' },
    { id: 2, user: 'MatchFeed', text: 'Backend game metadata is now connected here.', color: '#f0b429' },
  ]);

  useEffect(() => {
    if (!gameId) {
      setGame(featuredGames[0] ?? null);
      return;
    }

    void fetchGame(gameId)
      .then((data) => setGame(data))
      .catch(() => setGame(featuredGames[0] ?? null));
  }, [featuredGames, gameId]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    setChat((prev) => [...prev, { id: Date.now(), user: 'You', text: message.trim(), color: '#ec4899' }]);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 relative group">
        <div className="absolute inset-0">
          <img src={game?.heroImage ?? 'https://picsum.photos/seed/default-game/1920/1080'} alt={game?.title ?? 'Game View'} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white uppercase italic">{game?.title ?? 'Loading Game'}</h1>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Live</span>
              </div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                {game?.genre ?? 'Genre'} • {game?.publisher ?? 'Publisher'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Users size={16} className="text-brand-primary" />
              <span className="text-white text-xs font-black">{game?.activePlayers?.toLocaleString() ?? '0'}</span>
            </div>
            <button className="bg-white/10 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
              {game?.liveStreams ?? 0} Streams
            </button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-24 h-24 bg-brand-primary/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group/play">
            <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 group-hover/play:bg-brand-accent transition-colors">
              <Play size={32} className="text-white fill-current ml-1" />
            </div>
          </motion.button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${game?.title ?? 'GameHost'}`} alt="Streamer" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-white font-black uppercase italic text-sm">{game?.slug ?? 'game-room'}</h4>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Modes: {game?.modes.join(', ') ?? 'Loading...'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-white/60 hover:text-white transition-colors"><Volume2 size={20} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><Settings size={20} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><Maximize2 size={20} /></button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[400px] bg-[#0f0b21] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
            <MessageSquare size={18} className="text-brand-primary" /> Match Chat
          </h3>
          <div className="flex gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {chat.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: msg.color }}>{msg.user}</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white text-xs focus:outline-none focus:border-brand-primary/50 transition-all"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-accent hover:text-black transition-all">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
