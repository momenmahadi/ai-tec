/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Sparkles, BookOpen, Key, ChevronLeft, ShieldCheck, ArrowLeftRight, CheckCircle2, Award } from 'lucide-react';

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
    <div 
      id="landing-container" 
      className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-8 py-12 relative overflow-hidden bg-slate-50/50 selection:bg-blue-100 selection:text-blue-900"
    >
      {/* 2. Harmonious Educational Background Image & Translucent Overlays */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-overlay opacity-[0.04] transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1920&q=80')` 
        }} 
      />
      
      {/* Dynamic ambient color glow spots */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl opacity-30 pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-30 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating Sparkles in the background */}
      <div className="absolute top-12 left-1/4 opacity-10 animate-spin" style={{ animationDuration: '20s' }}>
        <Sparkles className="w-8 h-8 text-blue-600" />
      </div>
      <div className="absolute bottom-20 right-1/4 opacity-10 animate-bounce">
        <BookOpen className="w-8 h-8 text-indigo-500" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl text-center space-y-12 z-10">
        
        {/* Floating Active Status Widget (أيقونة الباقة المستمرة بالخلفية للوصول المباشر) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          onClick={onHaveActivationCode}
          className="mx-auto inline-flex items-center gap-2.5 px-5 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-full cursor-pointer transition-all shadow-lg shadow-amber-500/20 group select-none hover:-translate-y-0.5 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            باقة توليد الاختبارات: <span className="underline decoration-amber-200 group-hover:decoration-white font-black">اضغط لتفعيل الكود والبدء الآن 🔑</span>
          </span>
          <ChevronLeft className="w-4 h-4 text-white transition-transform group-hover:-translate-x-1" />
        </motion.div>

        {/* Headline section */}
        <div id="hero-headline-container" className="space-y-4 max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-6xl font-black leading-[1.2] text-slate-900 tracking-tight"
          >
            حوّل ملازمك إلى اختبارات ذكية ومتقنة في <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ثوانٍ معدودة</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-md sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto font-light"
          >
            نظام تقييم متطور يتعلم من مناهجك الدراسية وملخصاتك. ارفع ملف الـ PDF ودع الذكاء الاصطناعي يقوم بصياغة 15 سؤال قياس نموذجية مع تفسير علمي دقيق لكل إجابة.
          </motion.p>
        </div>

        {/* Premium Bento Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {/* Card 1: Study Analysis */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 text-right shadow-xs hover:border-blue-200 transition-all duration-300">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">تحليل فائق ومستمر</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              استخراج فوري للنصوص العربية والإنجليزية بدقة متناهية من كتبك وملخصاتك.
            </p>
          </div>

          {/* Card 2: 15 Core Questions */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 text-right shadow-xs hover:border-indigo-200 transition-all duration-300">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">15 سؤال خيار متعدد</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              أسئلة تقيس الفهم، التذكر، والتحليل مع توزيع ذكي ومقنن للخيارات.
            </p>
          </div>

          {/* Card 3: Live Verification */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 text-right shadow-xs hover:border-emerald-200 transition-all duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">تفاسير علمية مرافقة</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              تقديم تصحيح فوري وشروحات تعزز عملية الاستيعاب ومراجعة الأخطاء تلقائياً.
            </p>
          </div>
        </motion.div>

        {/* Pricing & Activation Bento Station */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Card A: Purchase Code (الباقة المباشرة) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl shadow-slate-900/15 border border-slate-800 relative overflow-hidden flex flex-col justify-between text-right"
          >
            {/* Subtle decor glowing orb inside card */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-25 pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500 rounded-full blur-2xl opacity-25 pointer-events-none" />

            <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#6366f1]">البداية السريعة</span>
                  <h2 className="text-xl font-bold">باقة توليد الاختبارات الشاملة</h2>
                </div>

                <div className="flex items-baseline justify-start gap-1 py-1">
                  <span className="text-4xl font-extrabold tracking-tight text-white">19</span>
                  <span className="text-sm text-slate-300 font-medium">ريالاً سعودياً / كود</span>
                </div>

                <ul className="text-right text-xs text-slate-300 space-y-3 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>شريحة كود للتفعيل الفوري (آمنة وضمان 100%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>رصيد وفير كافٍ لتشغيل اختبارات ذكية ومطولة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>استخلاص دقيق للمستويات والكتب الجامعية والملازم</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  onClick={handlePaymentRedirect}
                  className="w-full py-4 bg-white text-slate-950 hover:bg-slate-50 text-md font-bold rounded-2xl transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#4f46e5]" />
                  احصل على كود التفعيل
                </button>

                <p className="text-[10px] text-slate-400 font-light leading-normal">
                  * يتم توفير الكود بشكل فوري وتلقائي عبر رسالة نصية قصيرة SMS وبريد إلكتروني.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card B: Activation Box (مربع تفعيل الأداة والكود) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white text-slate-900 rounded-[32px] p-8 shadow-xl shadow-slate-100/80 border border-slate-100 relative overflow-hidden flex flex-col justify-between text-right"
          >
            {/* Subtle premium gold/amber decor orb */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-20 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 rounded-full blur-2xl opacity-20 pointer-events-none" />

            <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">التنشيط الفوري</span>
                  <h2 className="text-xl font-bold">تفعيل كود وباقة الاختبارات</h2>
                </div>

                {/* Styled illustration resembling the price tag for consistent visual balance */}
                <div className="flex items-center justify-start gap-2.5 py-1">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100/50">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-extrabold text-slate-800">أدخل الرمز المفعل</span>
                    <span className="text-[10px] text-slate-400 font-light">للاستفادة من محرك التقييم الذكي</span>
                  </div>
                </div>

                <ul className="text-right text-xs text-slate-500 space-y-3 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span>تفعيل الخدمة مباشرة لرفع ملفات وملازم الـ PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span>توليد فوري لعدد 15 سؤال قياس لكل محاولة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span>الرمز البرمجي التجريبي <strong className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">MOMEN2026</strong> متاح للتجريب</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  onClick={onHaveActivationCode}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-md font-bold rounded-2xl transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-white" />
                  هل استلمت الكود؟ اضغط هنا للتفعيل
                </button>

                <p className="text-[10px] text-slate-400 font-light leading-normal">
                  * سيتم نقلك مباشرة إلى صفحة إدخال الرمز لتنشيط الحساب والتحقق من الرصيد المتوفر.
                </p>
              </div>
            </div>
          </motion.div>
          
        </div>

      </div>
    </div>
  );
}
