import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  ArrowRight, 
  Play, 
  ChevronDown, 
  Twitter, 
  Instagram, 
  Facebook, 
  Youtube, 
  Github,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections = [
    {
      id: 'hero',
      title: "The Ultimate Gamer's Hub",
      subtitle: "Experience the next level of gaming with iGamia. Pledge, stream, and earn rewards in our vibrant community.",
      image: "https://picsum.photos/seed/football/800/800",
      align: 'left',
      buttons: true
    },
    {
      id: 'streaming',
      label: "LIVE GAME STREAMING",
      title: "Live Game Streaming",
      subtitle: "Watch your favorite gamers live and participate in the action. Support them with gifts and climb the leaderboard.",
      image: "https://picsum.photos/seed/racing/1200/600",
      align: 'center'
    },
    {
      id: 'pledge',
      label: "PLEDGE & PLAY",
      title: "Pledge & Play for Real Rewards",
      subtitle: "Put your skills to the test. Pledge on your own games or others and win real rewards.",
      image: "https://picsum.photos/seed/soccer/1200/600",
      align: 'center'
    },
    {
      id: 'social',
      label: "SOCIAL CONNECT",
      title: "Connect & Participate Socially",
      subtitle: "Build your network, chat with friends, and be part of the most active gaming community.",
      image: "https://picsum.photos/seed/cyberpunk/1200/600",
      align: 'center'
    },
    {
      id: 'mining',
      label: "EARN DAILY",
      title: "Earn iGamia Coins Daily",
      subtitle: "Mine iGamia Coins by watching videos and participating in daily challenges.",
      image: "https://picsum.photos/seed/vr/1200/600",
      align: 'center'
    },
    {
      id: 'referral',
      label: "REFER & EARN",
      title: "Refer & Earn Instantly",
      subtitle: "Invite your friends and earn rewards for every successful referral.",
      image: "https://picsum.photos/seed/cat/1200/600",
      align: 'center'
    },
    {
      id: 'wallet',
      label: "WALLET MANAGEMENT",
      title: "Buy & Manage Coins with Ease",
      subtitle: "Our secure wallet makes it easy to manage your USD and iGamia Coins.",
      image: "https://picsum.photos/seed/dice/1200/600",
      align: 'center'
    }
  ];

  const faqs = [
    { q: "What is iGamia?", a: "iGamia is a next-generation social gaming platform where you can pledge, stream, and earn rewards." },
    { q: "How do I earn iGamia Coins?", a: "You can earn coins through mining sessions (watching videos), daily challenges, and referrals." },
    { q: "Is the platform secure?", a: "Yes, we use advanced encryption and secure escrow systems for all transactions and pledges." },
    { q: "Can I withdraw my earnings?", a: "Absolutely. You can withdraw your USD balance to your preferred payment method easily." },
    { q: "What are Co-op Pledges?", a: "Co-op Pledges allow you to team up with friends to take on challenges and win larger prize pools." }
  ];

  return (
    <div className="min-h-screen bg-[#0f0b21] text-white selection:bg-brand-accent selection:text-black font-sans">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0b21]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Gamepad2 className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">iGamia</span>
          </div>
          <nav className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <a href="#hero" className="hover:text-brand-accent transition-colors">Home</a>
            <a href="#features" className="hover:text-brand-accent transition-colors">Features</a>
            <a href="#about" className="hover:text-brand-accent transition-colors">About</a>
            <a href="#faq" className="hover:text-brand-accent transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">Login</Link>
            <Link to="/signup" className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20">Join Now</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-40 pb-20 px-6 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1635] via-[#0f0b21] to-[#0f0b21]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Welcome to iGamia</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
              The Ultimate <br />
              <span className="text-brand-primary">Gamer's Hub</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-md leading-relaxed">
              Experience the next level of gaming with iGamia. Pledge, stream, and earn rewards in our vibrant community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="flex items-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-brand-primary/20">
                Join Now <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="flex items-center gap-2 bg-white/5 border border-white/10 px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                Log In
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f0b21] overflow-hidden bg-zinc-800">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span className="text-white">10k+</span> Gamers Online
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/football/800/800" 
                alt="Hero" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21]/80 via-transparent to-transparent" />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-accent/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-primary/20 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Feature Sections */}
      <div id="features" className="space-y-32 py-32">
        {sections.slice(1).map((section, index) => (
          <section key={section.id} className="px-6">
            <div className="max-w-5xl mx-auto text-center space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">{section.label}</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{section.title}</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  {section.subtitle}
                </p>
                <div className="pt-4">
                  <Link to="/signup" className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all">
                    Explore <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative group"
              >
                <div className="absolute -inset-4 bg-brand-primary/5 rounded-[3rem] blur-2xl group-hover:bg-brand-primary/10 transition-all" />
                <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                  <img 
                    src={section.image} 
                    alt={section.title} 
                    className="w-full aspect-[2/1] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b21]/60 to-transparent" />
                </div>
                {/* Decorative lines like in the image */}
                <div className="absolute top-1/2 -left-8 w-1 h-32 bg-brand-accent rounded-full -translate-y-1/2 opacity-50" />
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      {/* About Us Section */}
      <section id="about" className="py-32 px-6 bg-[#1a1635]/30">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/gamer/800/1000" 
                alt="About Us" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-brand-primary p-8 rounded-[2rem] shadow-2xl">
              <p className="text-4xl font-black text-white">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Gamer Focused</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">WHO WE ARE</span>
            <h2 className="text-5xl font-black tracking-tighter uppercase">About Us</h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              iGamia is more than just a platform; it's a movement. We're dedicated to empowering gamers worldwide by providing tools to monetize their passion, connect with their community, and experience gaming in a whole new way.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-brand-primary font-bold mb-2 uppercase tracking-widest text-xs">Mission</h4>
                <p className="text-sm text-zinc-500">To create the most rewarding gaming ecosystem.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-brand-accent font-bold mb-2 uppercase tracking-widest text-xs">Vision</h4>
                <p className="text-sm text-zinc-500">A world where every gamer can earn from their skills.</p>
              </div>
            </div>
            <button className="bg-white text-black px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
              Learn More
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">GOT QUESTIONS?</span>
            <h2 className="text-5xl font-black tracking-tighter uppercase">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                >
                  <span className="font-bold text-lg">{faq.q}</span>
                  <ChevronDown className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 pt-0 text-zinc-400 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#0f0b21]">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <Gamepad2 className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">iGamia</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>

          <div className="flex gap-6">
            {[Twitter, Instagram, Facebook, Youtube, Github].map((Icon, i) => (
              <a key={i} href="#" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all border border-white/10">
                <Icon size={20} />
              </a>
            ))}
          </div>

          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2024 iGamia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
