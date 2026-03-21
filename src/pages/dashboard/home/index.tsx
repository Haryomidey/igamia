import React from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Users, 
  TrendingUp, 
  Pickaxe, 
  Search, 
  Bell, 
  Coins, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const ongoingStreams = [
    {
      id: 1,
      title: "Sailor Deep Warriors",
      streamer: "PiratePro",
      viewers: "12.4k",
      image: "https://picsum.photos/seed/pirate/800/400",
      active: true
    },
    {
      id: 2,
      title: "Cyber City Showdown",
      streamer: "NeonKnight",
      viewers: "8.2k",
      image: "https://picsum.photos/seed/cyberpunk/800/400",
      active: false
    }
  ];

  const pledgingActivities = [
    {
      id: 1,
      title: "Pledge - Co-op Showdown",
      streamer: "GamerX",
      date: "24 Oct 2024",
      time: "08:00 PM GMT+1",
      prize: "$5,000",
      image: "https://picsum.photos/seed/game1/400/400"
    },
    {
      id: 2,
      title: "Pledge - Co-op Showdown",
      streamer: "GamerX",
      date: "24 Oct 2024",
      time: "08:00 PM GMT+1",
      prize: "$5,000",
      image: "https://picsum.photos/seed/game2/400/400"
    },
    {
      id: 3,
      title: "Pledge - Co-op Showdown",
      streamer: "GamerX",
      date: "24 Oct 2024",
      time: "08:00 PM GMT+1",
      prize: "$5,000",
      image: "https://picsum.photos/seed/game3/400/400"
    },
    {
      id: 4,
      title: "Pledge - Co-op Showdown",
      streamer: "GamerX",
      date: "24 Oct 2024",
      time: "08:00 PM GMT+1",
      prize: "$5,000",
      image: "https://picsum.photos/seed/game4/400/400"
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gear up and game hard, John!</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search..."
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-primary/50 w-full md:w-64 transition-all"
            />
          </div>
          <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors relative">
            <Bell size={20} className="text-zinc-400" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-brand-accent rounded-full border-2 border-[#0f0b21]" />
          </button>
          <div className="flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 rounded-2xl">
            <div className="w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center">
              <Coins size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-white">1,500 <span className="text-brand-primary">IGC</span></span>
          </div>
        </div>
      </header>

      {/* Ongoing Streams */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Ongoing Streams</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 relative group rounded-[2.5rem] overflow-hidden border border-white/10 aspect-video lg:aspect-auto lg:h-[400px]">
            <img 
              src={ongoingStreams[0].image} 
              alt={ongoingStreams[0].title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-6 left-6 flex flex-col gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-widest">{ongoingStreams[0].title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-brand-primary overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ongoingStreams[0].streamer}`} alt="Streamer" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{ongoingStreams[0].streamer}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Users size={10} /> {ongoingStreams[0].viewers} viewers
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-6 right-6">
              <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Link to="/stream" className="w-20 h-20 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 hover:scale-110 transition-transform group-hover:bg-brand-accent group-hover:text-black">
                <Play size={32} className="fill-current ml-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3 hidden lg:block relative rounded-[2.5rem] overflow-hidden border border-white/10">
            <img 
              src={ongoingStreams[1].image} 
              alt={ongoingStreams[1].title} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-rose-500/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs font-black text-white uppercase tracking-widest mb-2">{ongoingStreams[1].title}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ongoingStreams[1].streamer}`} alt="Streamer" />
                </div>
                <p className="text-[10px] font-bold text-zinc-400">{ongoingStreams[1].streamer}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pledging Activities */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Pledging Activities</h2>
          <Link to="/library" className="text-brand-primary text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">View All</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pledgingActivities.map((activity) => (
            <motion.div 
              key={activity.id}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="relative aspect-square">
                <img 
                  src={activity.image} 
                  alt={activity.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-primary">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.streamer}`} alt="Streamer" />
                  </div>
                  <span className="text-[10px] font-bold text-white">{activity.streamer}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-white text-sm uppercase leading-tight">{activity.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Calendar size={12} className="text-brand-primary" /> {activity.date}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <TrendingUp size={12} className="text-brand-primary" /> {activity.time}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <DollarSign size={12} className="text-brand-accent" /> Prize Pool: <span className="text-white">{activity.prize}</span>
                  </div>
                </div>
                <Link to="/library" className="block w-full bg-brand-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20 text-center">
                  Pledge With Us
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Favorite Games */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Favorite Games</h2>
          <Link to="/library" className="text-brand-primary text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">View All</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pledgingActivities.map((activity) => (
            <motion.div 
              key={activity.id}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="relative aspect-square">
                <img 
                  src={activity.image} 
                  alt={activity.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21] via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to="/play" className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-xl">
                    <Play size={20} className="text-white fill-current ml-1" />
                  </Link>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Play Now</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-white text-sm uppercase leading-tight">{activity.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Users size={12} className="text-brand-primary" /> 12.4k Active
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <TrendingUp size={12} className="text-brand-primary" /> 450 Live Streams
                  </div>
                </div>
                <Link to="/library" className="block w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary transition-all text-center">
                  View Game
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
