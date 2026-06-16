/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Sparkles, BookOpen, ChevronLeft, ShieldCheck } from 'lucide-react';

interface LandingSectionProps {
  paymentLink: string;
  onHaveActivationCode: () => void;
}

export default function LandingSection({ paymentLink, onHaveActivationCode }: LandingSectionProps) {
  // Action to navigate to the payment page securely
  const handlePaymentRedirect = () => {
    window.open(paymentLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="landing-container" className="min-h-[82vh] flex flex-col justify-center items-center px-6 sm:px-12 py-16 relative overflow-hidden bg-white selection:bg-blue-50 select-none">
      {/* Subtle background glow inspired by minimalism layout */}
      <div className="absolute top-1/4 right-[10%] w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Main Core Minimal Form */}
      <div className="w-full max-w-2xl text-center space-y-10 z-10">
        
        {/* Topic Tag */}
        <motion.div
          id="hero-sparkle-tag"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block py-1.5 px-4 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest leading-none select-none"
        >
          ذكاء اصطناعي فوري
        </motion.div>

        {/* Big Premium Headline */}
        <motion.div
          id="hero-headline-container"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-5"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.15] text-[#111827] tracking-tight">
            حوّل ملازمك إلى اختبارات تفاعلية في <span className="text-blue-600">30 ثانية</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-lg mx-auto font-light">
            ارفع ملفات ملخصاتك أو كتبك بصيغة PDF ودع محرك الذكاء الاصطناعي يتولى صياغة الأسئلة والتصحيح التلقائي بدقة متناهية.
          </p>
        </motion.div>

        {/* Feature Grid Mini Bullets (Spacious Grid) */}
        <motion.div
          id="hero-features-strip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-2"
        >
          <div className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-700">توليد واختبار فوري</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-700">15 سؤال خيار متعدد</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-700">تفسير علمي لكل فقرة</span>
          </div>
        </motion.div>

        {/* Core Click Action (Minimal Premium Buy Button) */}
        <motion.div
          id="hero-action-buttons-container"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-4 pt-4"
        >
          <button
            id="buy-now-btn"
            onClick={handlePaymentRedirect}
            className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-2xl shadow-xl shadow-blue-100 hover:shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none cursor-pointer flex items-center justify-center gap-2"
          >
            اشترِ الباقة الآن بـ 19 ريال
          </button>
          
          <p className="text-xs text-slate-400">
            * دفع آمن مباشر وسرعة فائقة في معالجة المدخلات.
          </p>
        </motion.div>

        {/* Toggle link style matching index HTML: underlined offset */}
        <motion.div
          id="activation-code-toggle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="pt-6"
        >
          <button
            id="reveal-activation-form-btn"
            onClick={onHaveActivationCode}
            className="text-gray-400 hover:text-blue-600 text-sm font-medium underline underline-offset-8 decoration-gray-200 hover:decoration-blue-200 transition-all cursor-pointer"
          >
            هل لديك كود تفعيل؟ أدخله هنا لتفعيل الأداة
          </button>
        </motion.div>

      </div>
    </div>
  );
}
