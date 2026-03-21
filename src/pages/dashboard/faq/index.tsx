import React from 'react';
import { HelpCircle, ChevronRight, MessageSquare, Shield, FileText } from 'lucide-react';
import { useToast } from '../../../components/ToastProvider';

export default function FAQ() {
  const toast = useToast();
  const faqs = [
    { q: "What is iGamia?", a: "iGamia is a social gaming platform where you can pledge USD on games, stream your gameplay, and earn rewards." },
    { q: "How do I mine iGamia Coins?", a: "You can mine coins daily by watching featured videos in the 'Mine' section. Each video watched adds to your daily mining progress." },
    { q: "Is my money safe?", a: "Yes, we use secure escrow systems for all pledges and industry-standard encryption for your wallet." },
    { q: "Can I withdraw iGamia Coins?", a: "iGamia Coins (IGC) are currently non-withdrawable. They will be convertible to mainnet tokens once listed on exchanges." },
    { q: "How do I earn from referrals?", a: "Invite friends using your unique link. You'll earn USD rewards once they complete their first pledge or profile setup." }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-10">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tighter">FREQUENTLY ASKED QUESTIONS</h1>
        <p className="text-zinc-500">Everything you need to know about the iGamia platform.</p>
      </header>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
              <span className="font-bold text-white group-open:text-brand-primary transition-colors">{faq.q}</span>
              <ChevronRight className="text-zinc-500 group-open:rotate-90 transition-transform" size={20} />
            </summary>
            <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <div className="bg-brand-primary/5 border border-brand-primary/20 p-8 rounded-[2.5rem] text-center space-y-6">
        <h3 className="text-xl font-bold">Still have questions?</h3>
        <p className="text-zinc-500 text-sm">Our support team is available 24/7 to help you with any issues.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => toast.info('Support ticket system coming soon. Please email support@igamia.com.')}
            className="bg-brand-primary text-black px-8 py-3 rounded-full font-bold hover:bg-brand-primary/80 transition-colors flex items-center gap-2"
          >
            <MessageSquare size={18} /> Contact Support
          </button>
          <button 
            onClick={() => toast.info('Documentation coming soon. Check our whitepaper for more details.')}
            className="bg-zinc-800 text-white px-8 py-3 rounded-full font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <FileText size={18} /> Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
