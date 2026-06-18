/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, Github, Globe, Heart, Settings } from 'lucide-react';
import { AppView, SupabaseConfig } from './types';
import LandingSection from './components/LandingSection';
import ToolSection from './components/ToolSection';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  
  // Settings / Environment Configurations
  const [paymentLink, setPaymentLink] = useState('https://whop.com/checkout/4lbqzFI5cMVO8Rd8ch-MLnc-G9Fr-7Sro-K34TysgbiS4J/');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [useSandbox, setUseSandbox] = useState(false); // Disabled by default to connect to the live Supabase database!
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: 'https://iztnifbjifymzhlfnhfb.supabase.co',
    anonKey: 'sb_publishable_F71co5Psb-Vm8xuhqIbarA_XZq0phDm',
  });

  // Sync state with localStorage if available for persistence
  useEffect(() => {
    const savedLink = localStorage.getItem('PAY_LINK');
    const savedSandbox = localStorage.getItem('USE_SANDBOX');
    const savedSupaUrl = localStorage.getItem('SUPA_URL');
    const savedSupaKey = localStorage.getItem('SUPA_KEY');

    if (savedLink && 
        savedLink !== 'https://salla.sa/your-pay-page-placeholder' && 
        savedLink !== 'https://whop.com/5-pdf/7c63b963-c7b5-4776-ae87-2d3d6ef96292') {
      setPaymentLink(savedLink);
    }
    if (savedSandbox !== null) setUseSandbox(savedSandbox === 'true');
    if (savedSupaUrl && savedSupaKey) {
      setSupabaseConfig({ url: savedSupaUrl, anonKey: savedSupaKey });
    }
  }, []);

  // Save changes locally to persist options between dev hot-reloads
  const handleSetPaymentLink = (link: string) => {
    setPaymentLink(link);
    localStorage.setItem('PAY_LINK', link);
  };

  const handleSetUseSandbox = (val: boolean) => {
    setUseSandbox(val);
    localStorage.setItem('USE_SANDBOX', String(val));
  };

  const handleSetSupabaseConfig = (conf: SupabaseConfig) => {
    setSupabaseConfig(conf);
    localStorage.setItem('SUPA_URL', conf.url);
    localStorage.setItem('SUPA_KEY', conf.anonKey);
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col relative font-sans selection:bg-blue-50 selection:text-blue-900" style={{ direction: 'rtl' }}>
      
      {/* Floating System Configurations Drawer */}
      <SettingsPanel
        supabaseConfig={supabaseConfig}
        setSupabaseConfig={handleSetSupabaseConfig}
        paymentLink={paymentLink}
        setPaymentLink={handleSetPaymentLink}
        customGeminiKey={customGeminiKey}
        setCustomGeminiKey={setCustomGeminiKey}
        useSandbox={useSandbox}
        setUseSandbox={handleSetUseSandbox}
      />

      {/* Styled Premium Header - Clean Minimalism */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div 
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 transition select-none group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/15 group-hover:scale-105 transition duration-200">
            <BrainCircuit className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">مُعلِّـم الذكي</h1>
            <p className="text-[10px] text-slate-400 font-medium">الذكاء الاصطناعي الأكاديمي</p>
          </div>
        </div>

        {/* Global Action Links */}
        <div className="flex items-center gap-8 text-sm font-semibold">
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition cursor-pointer text-xs sm:text-sm ${
              currentView === 'landing' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-650'
            }`}
          >
            تصفح الرئيسية
          </button>
          
          <button
            onClick={() => setCurrentView('tool')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 cursor-pointer ${
              currentView === 'tool' ? 'bg-indigo-600 text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            الذهاب للأداة
          </button>
        </div>
      </header>

      {/* Main Orchestrator Route Panel */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'landing' ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandingSection
                paymentLink={paymentLink}
                onHaveActivationCode={() => setCurrentView('tool')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tool-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ToolSection
                supabaseConfig={supabaseConfig}
                customGeminiKey={customGeminiKey}
                useSandbox={useSandbox}
                onBackToLanding={() => setCurrentView('landing')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant minimalist Footer */}
      <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400 bg-white select-none max-w-6xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 جميع الحقوق محفوظة لـ "مُعلِّـم الذكي"</p>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Supabase REST Engine</span>
          <span>•</span>
          <span>Gemini AI Pro</span>
        </div>
      </footer>

    </div>
  );
}
