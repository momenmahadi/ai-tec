/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, Sparkles, BookOpen, Key, ChevronLeft, ShieldCheck, CheckCircle2, 
  Award, HelpCircle, ArrowRight, Star, ArrowUpRight, Users, Eye, BarChart3, Clock 
} from 'lucide-react';

interface LandingSectionProps {
  paymentLink: string;
  onHaveActivationCode: () => void;
}

export default function LandingSection({ paymentLink, onHaveActivationCode }: LandingSectionProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Action to navigate to the payment page securely
  const handlePaymentRedirect = () => {
    window.open(paymentLink, '_blank', 'noopener,noreferrer');
  };

  const faqs = [
    {
      q: "كيف يعمل نظام الذكاء الاصطناعي في صياغة الأسئلة؟",
      a: "يعمل نظامنا الذكي على قراءة وحصر المادة التعليمية وتحليلها تربوياً، ومن ثم يصيغ أسئلة اختبارية تقيس مستويات التذكر، الفهم، والتطبيق حسب هرم بلوم المعرفي، مع تأصيل الشروحات لكل إجابة."
    },
    {
      q: "هل الخدمة تفهم اللغة العربية واللغات الأجنبية؟",
      a: "نعم، النظام معزز بنماذج متطورة ثنائية اللغة تدعم استخلاص النصوص العربية والإنجليزية بدقة تامة في نفس المحاولة بنسبة نجاح تفوق 98%."
    },
    {
      q: "ما هو الكود التجريبي المجاني للمنصة؟",
      a: "يمكنك تجربة المنصة فوراً وتوليد اختبارات حية بدون دفع بالضغط على زر التفعيل وإدخال الكود المالي الموحد للتجريب: Ai2027."
    },
    {
      q: "كيف يمكنني تصدير ومشاركة الأسئلة الناتجة؟",
      a: "توفر لك المنصة خيارات تصدير فورية ومتنوعة كالحفظ في لوحة التحكم، الطباعة الورقية المباشرة المنسقة كملف PDF، النسخ السريع، أو المشاركة كمسودة جاهزة بكامل تفاصيلها على Gmail."
    }
  ];

  return (
    <div 
      id="landing-container" 
      className="min-h-screen flex flex-col justify-start items-center px-4 sm:px-8 py-8 relative overflow-hidden bg-radial from-slate-50 via-white to-slate-50 selection:bg-indigo-100 selection:text-indigo-900"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-indigo-200/45 to-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/40 to-teal-100/35 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl z-10 space-y-16 sm:space-y-24 mt-4">
        
        {/* Floating Promo Ticker */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            onClick={onHaveActivationCode}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-150 cursor-pointer shadow-xs select-none transition-all duration-200 group-hover:scale-105 active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-bold leading-none">
              الكود المالي المجاني للتجربة: <span className="underline decoration-indigo-300 font-extrabold font-mono">Ai2027</span>
            </span>
            <ChevronLeft className="w-3.5 h-3.5 text-indigo-500 group-hover:-translate-x-0.5 transition-transform" />
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-[56px] font-black leading-[1.15] text-slate-900 tracking-tight"
          >
            اصنع اختبارات ذكية فائقة الدقة من ملازمك في <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">30 ثانية</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-slate-600 text-[15px] sm:text-[17px] leading-relaxed max-w-2xl mx-auto font-light"
          >
            محرك التقييم الأكاديمي الذاتي الأسرع للمعلمين والطلاب. ارفع كتبك أو ملخصاتك بصيغة <span className="text-indigo-600 font-semibold">PDF</span> ودع الذكاء الاصطناعي يستخلص الهيكل ويصوغ 15 سؤالاً قياسياً مدعوماً بالتفسير العلمي المعتمد.
          </motion.p>

          {/* Core Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onHaveActivationCode}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-600/15 cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-white" />
              ابدأ التوليد المجاني الآن
            </button>
            <button
              onClick={handlePaymentRedirect}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-2xl border border-slate-200 cursor-pointer shadow-xs transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              شراء كود جديد
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-6 text-slate-500 text-xs font-semibold"
          >
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-slate-700 mr-1">4.9/5 متوسط التقييم</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>أكثر من 10k معلم وطالب مسجل</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>موثوق بدقة مطابقة 100% للملازم</span>
            </div>
          </motion.div>
        </div>

        {/* Dynamic SaaS Visual Representation (Interactive Map) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white p-2"
        >
          {/* Mockup Frame Header */}
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="bg-white px-8 py-1 rounded-md text-[10px] text-slate-400 font-mono tracking-wide mx-auto max-w-[280px] w-full text-center border border-slate-100 shadow-2xs">
              smart-teacher-ai-quiz.run.app
            </div>
          </div>
          {/* Mockup Frame Body */}
          <div className="p-4 sm:p-8 bg-slate-50/50 grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-right">
            
            {/* Left Column Mock Quiz */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold">مادة العلوم الطبيعية - الصف السادس</span>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">15 سؤال قياس</span>
              </div>
              <div className="space-y-3">
                <p className="text-[13px] font-bold text-slate-800">س١: أي من الطبقات الصخرية التالية تعتبر الأكثر رقة على سطح كوكب الأرض؟</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 border border-emerald-300 bg-emerald-50 text-emerald-950 rounded-xl text-xs flex justify-between items-center font-bold">
                    <span>أ) القشرة الأرضية</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-3 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-xs opacity-60">ب) الوشاح العلوي</div>
                  <div className="p-3 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-xs opacity-60">ج) النواة الصلبة</div>
                  <div className="p-3 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-xs opacity-60">د) الوشاح الداخلي</div>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                <p className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> التفسير العلمي المعتمد:
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                  تغطي القشرة الأرضية الكوكب كقشرة رقيقة للغاية تتراوح سماكتها من 5 كم في قاع المحيطات إلى 70 كم كحد أقصى تحت الجبال مقارنة بالنواة والوشاح.
                </p>
              </div>
            </div>

            {/* Right Column Process highlights */}
            <div className="md:col-span-5 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-600 font-extrabold tracking-wider uppercase">تحكم كامل ذكي</span>
                <h3 className="text-xl font-bold text-slate-900">صياغة اختبارات تفصيلية تفاعلية</h3>
                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  احصل على نتائج تربوية تعادل ما يبنيه خبراء المناهج والقياس في ثوانٍ.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">توفير 5 ساعات من إعداد المعلم</p>
                    <p className="text-[10px] text-slate-400">تختصر وقت التحضير بنسبة 95%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">توزيع متوازن وموزون للخيارات</p>
                    <p className="text-[10px] text-slate-400">خيارات حقيقية ذكية وعادلة وتنافسية</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">خلو تام من الهلوسة العلمية</p>
                    <p className="text-[10px] text-slate-400">معلومات مستخرجة حصرياً من نص الملزمة</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Feature Sections - Step by step user journey flow */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">خطوة بخطوة</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">رحلتك السلسة لإنجاز اختبارك النموذجي</h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto font-light">تواصل تلقائي ومبسط يخدم الكادر التعليمي لتعزيز جودة القياس.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "٠١",
                title: "تحميل مستند الـ PDF",
                desc: "ارفع الكتب أو الملاحظات بطريقة السحب والإفلات بحد لم يسبق له مثيل في الأمان والخصوصية.",
                color: "bg-blue-50 text-blue-600 border-blue-105"
              },
              {
                step: "٠٢",
                title: "التحليل والاستخلاص",
                desc: "يقوم المستخرج بمسح وتفريغ فوري للنصوص العربية واستيعابها ومراجعتها بضمان تام الفورية.",
                color: "bg-indigo-50 text-indigo-600 border-indigo-105"
              },
              {
                step: "٠٣",
                title: "التوليد والمطابقة",
                desc: "صياغة 15 سؤال قسيم خيارات متعددة مع الشروحات المستنبطة المبرهنة من داخل المذكرة تماماً.",
                color: "bg-purple-50 text-purple-600 border-purple-105"
              },
              {
                step: "٠٤",
                title: "التصدير والمشاركة",
                desc: "اطبع الاختبار مباشرة كنسخة PDF رسمية للاستخدام، أو انسخه، أو أرسله كمسودة جاهزة ومكتوبة على Gmail.",
                color: "bg-emerald-50 text-emerald-600 border-emerald-105"
              }
            ].map((journey, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 text-right relative space-y-4 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${journey.color}`}>
                  {journey.step}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">{journey.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">{journey.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Activation Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
          
          {/* Card A: Direct Buying Option */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-950 text-white rounded-[32px] p-8 sm:p-10 border border-slate-850 shadow-xl relative overflow-hidden flex flex-col justify-between text-right"
          >
            {/* Soft decorative visual gradients */}
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-44 h-44 bg-purple-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">الحصول الفوري على الخدمة</span>
                <h3 className="text-2xl font-bold">باقة المفاتيح الموحدة</h3>
                <p className="text-slate-400 text-xs font-light">ابدأ فوراً بأرصدة سخية لصياغة اختبارات بلا حدود</p>
              </div>

              {/* Price details */}
              <div className="pb-4">
                <div className="flex items-baseline justify-start gap-1">
                  <span className="text-5xl font-black text-white leading-none font-mono">19</span>
                  <span className="text-xs text-slate-300 font-bold">ريال سعودي فقط / كود</span>
                </div>
              </div>

              {/* Feature checklists */}
              <ul className="space-y-3.5 text-xs text-slate-300 font-light">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توليد أكواد معطلة لـ 15 محاولة توليد كاملة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>استخلاص متقدم للكتب المدرسية والمناهج المعقدة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>دعم كامل وتأصيلي لطباعة وتصدير مستندات PDF</span>
                </li>
              </ul>

              <div className="pt-6">
                <button
                  onClick={handlePaymentRedirect}
                  className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  اقتناء باقة تفعيل الكود الآن
                </button>
                <p className="text-[10px] text-slate-500 pt-3 font-light text-center">
                  * يتم إرسال الكود برقم مفعل فوري وتلقائي عبر رسالة الجوال SMS والبريد.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card B: Activation Field Box */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white text-slate-900 rounded-[32px] p-8 sm:p-10 border border-slate-150 shadow-xl relative overflow-hidden flex flex-col justify-between text-right"
          >
            {/* Decors */}
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

            <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">التنشيط والدخول المباشر</span>
                  <h3 className="text-2xl font-bold">بوابة العمل الحالية</h3>
                  <p className="text-slate-400 text-xs font-light">هل تمتلك رمز تفعيل بالفعل؟ أدخل الرمز للدخول الفوري</p>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
                  <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Key className="w-4 h-4 text-indigo-600" />
                    المعاينة التجريبية الفورية متاحة مجاناً:
                  </p>
                  <p className="text-slate-600 text-xs font-light leading-relaxed">
                    يمكنك استخدام مفتاح التنشيط العام للوصول المفتوح السحابي فوراً: 
                    <strong className="font-mono text-indigo-700 bg-white border border-indigo-200/60 px-1.5 py-0.5 rounded mr-1 select-all font-black">Ai2027</strong>
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-500 font-light">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>توليد 15 سؤال قياس حصرياً من النص المستورد</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>أرصدة قياس حقيقية تتحدث وتتأثر تراكمياً في قاعدة البيانات</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onHaveActivationCode}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-600/15 cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-white" />
                  ادخل الأداة والرمز للبدء
                </button>
                <p className="text-[10px] text-slate-400 pt-3 font-light text-center">
                  * سيتم نقلك مباشرة إلى صفحة رفع ملف الـ PDF فور تزويدنا بالمفتاح بنجاح.
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* F.A.Q Section */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">الأسئلة الشائعة</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-light">كل ما يتبادر إلى ذهنك حول الأداء والدقة والاستحقاق.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 text-right transition shadow-2xs"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-right outline-none cursor-pointer"
                  >
                    <span className="text-sm font-extrabold text-slate-850">{faq.q}</span>
                    <ChevronLeft className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${isOpen ? '-rotate-90 text-indigo-600' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-slate-500 font-light leading-relaxed pt-3 mt-3 border-t border-slate-100"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
