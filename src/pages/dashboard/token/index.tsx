import React from 'react';
import { motion } from 'motion/react';
import { Coins, TrendingUp, Shield, Zap, Info, ArrowRight } from 'lucide-react';
import { useToast } from '../../../components/ToastProvider';

export default function TokenPage() {
  const toast = useToast();

  return (
    <div className="space-y-12 pb-20">
      <header className="text-center space-y-4 pt-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-brand-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-brand-primary/20"
        >
          <Coins className="text-black" size={48} />
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter">iGamia COIN (IGC)</h1>
        <p className="text-zinc-500 max-w-xl mx-auto text-lg">
          The native utility token powering the iGamia ecosystem. Mine, earn, and trade within the world's first social pledging platform.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: TrendingUp, title: 'Utility', desc: 'Use IGC for exclusive game entries, premium features, and governance.' },
          { icon: Shield, title: 'Security', desc: 'Built on high-performance blockchain tech with audited smart contracts.' },
          { icon: Zap, title: 'Rewards', desc: 'Earn IGC through daily mining, referrals, and top-tier gameplay.' }
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-brand-primary/30 transition-colors">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <item.icon className="text-brand-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4">{item.title}</h3>
            <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="bg-zinc-900 rounded-[3rem] border border-zinc-800 p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full" />
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-6">TOKENOMICS</h2>
            <div className="space-y-6">
              {[
                { label: 'Total Supply', value: '1,000,000,000 IGC' },
                { label: 'Mining Pool', value: '40% (400M IGC)' },
                { label: 'Ecosystem & Rewards', value: '30% (300M IGC)' },
                { label: 'Team & Development', value: '15% (150M IGC)' },
                { label: 'Liquidity Pool', value: '15% (150M IGC)' }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <span className="text-zinc-500 font-medium">{stat.label}</span>
                  <span className="text-white font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-950 rounded-[2rem] p-8 border border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <Info className="text-brand-primary" size={20} />
              <h4 className="font-bold">Listing Status</h4>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              IGC is currently in the "Mining Phase". Mainnet launch and exchange listings are scheduled for Q4 2026. 
              Mined coins will be convertible 1:1 to the mainnet token upon listing.
            </p>
            <button 
              onClick={() => toast.info('Roadmap coming soon. Stay tuned for our Q4 2026 launch.')}
              className="w-full bg-brand-primary text-black py-4 rounded-2xl font-bold hover:bg-brand-primary/80 transition-colors flex items-center justify-center gap-2"
            >
              View Roadmap <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
