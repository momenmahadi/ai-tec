/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, CheckCircle2, AlertTriangle, FileText, UploadCloud, Cpu, Loader2, Sparkles,
  ArrowRight, Award, CheckCircle, XCircle, Info, RefreshCw, ClipboardType, BookOpen, AlertCircle
} from 'lucide-react';
import { Question, SupabaseConfig, ActiveKey } from '../types';
import { extractTextFromPdf } from '../utils/pdfParser';

interface ToolSectionProps {
  supabaseConfig: SupabaseConfig;
  customGeminiKey: string;
  useSandbox: boolean;
  onBackToLanding: () => void;
}

export default function ToolSection({
  supabaseConfig,
  customGeminiKey,
  useSandbox,
  onBackToLanding,
}: ToolSectionProps) {
  // Navigation & Core States
  const [toolView, setToolView] = useState<'activate' | 'builder' | 'quiz'>('activate');
  const [activationCode, setActivationCode] = useState('');
  const [activeKey, setActiveKey] = useState<ActiveKey | null>(null);
  
  // Input Method (PDF vs Text Paste)
  const [inputMethod, setInputMethod] = useState<'pdf' | 'text'>('pdf');
  const [manualText, setManualText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Async states
  const [isVerifying, setIsVerifying] = useState(false);
  const [pdfParsingProgress, setPdfParsingProgress] = useState<number | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Quiz States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({}); // index -> selected option text
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // 1. Activation Verification
  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const codeToVerify = activationCode.trim();
    if (!codeToVerify) {
      setErrorText('يرجى إدخال كود التفعيل أولاً.');
      return;
    }

    setIsVerifying(true);

    try {
      if (useSandbox) {
        // Sandboxed flow for rapid review
        await new Promise((res) => setTimeout(res, 800)); // smooth visual pause
        
        if (codeToVerify.toUpperCase() === 'DEMO100') {
          const mockKey: ActiveKey = { code: 'DEMO100', credits: 5 };
          setActiveKey(mockKey);
          setToolView('builder');
        } else if (codeToVerify.toUpperCase() === 'MOUNT') {
          const mockKey: ActiveKey = { code: 'MOUNT', credits: 15 };
          setActiveKey(mockKey);
          setToolView('builder');
        } else {
          // Allow any random code in sandbox mode to easily pass with 3 credits for convenience!
          const mockKey: ActiveKey = { code: codeToVerify.toUpperCase(), credits: 3 };
          setActiveKey(mockKey);
          setToolView('builder');
        }
      } else {
        // Actual Supabase connection!
        const normalizeSupaUrl = (rawUrl: string): string => {
          let u = rawUrl.trim();
          while (u.endsWith('/')) {
            u = u.slice(0, -1);
          }
          if (u.endsWith('/rest/v1')) {
            u = u.slice(0, -8);
          } else if (u.endsWith('rest/v1')) {
            u = u.slice(0, -7);
          }
          while (u.endsWith('/')) {
            u = u.slice(0, -1);
          }
          return u;
        };

        const baseUrl = normalizeSupaUrl(supabaseConfig.url);
        const anonKey = supabaseConfig.anonKey.trim();

        if (!baseUrl || !anonKey || baseUrl.includes('placeholder') || anonKey.includes('xxxxxx')) {
          throw new Error('يرجى تهيئة مفاتيح ربط Supabase بشكل صحيح في قائمة الإعدادات (أيقونة الترس أسفل اليسار).');
        }

        let data: any[] = [];
        let detectedColumn = 'key_code';

        // Try key_code first to match the user's specific guidelines
        try {
          const fetchUrl = `${baseUrl}/rest/v1/active_keys?key_code=eq.${encodeURIComponent(codeToVerify)}&select=*`;
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
              throw new Error('not_found_in_keycode');
            }
          } else {
            let errorMsg = '';
            try {
              const errBody = await response.json();
              errorMsg = errBody.message || errBody.error || JSON.stringify(errBody);
            } catch {
              errorMsg = `${response.status} ${response.statusText || ''}`;
            }
            throw new Error(errorMsg);
          }
        } catch (e: any) {
          // Fallback to code if key_code column does not exist or was not found
          const fetchUrl = `${baseUrl}/rest/v1/active_keys?code=eq.${encodeURIComponent(codeToVerify)}`;
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            let errorMsg = '';
            try {
              const errBody = await response.json();
              errorMsg = errBody.message || errBody.error || JSON.stringify(errBody);
            } catch {
              errorMsg = `${response.status} ${response.statusText || ''}`;
            }
            throw new Error(`فشل الاتصال بـ Supabase: ${errorMsg}`);
          }
          data = await response.json();
          detectedColumn = 'code';
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('رمز التفعيل الذي أدخلته غير متواجد في قاعدة البيانات. يرجى مراجعة الكود أو شراء باقة صالحة.');
        }

        const record = data[0];
        const credits = typeof record.credits === 'number' ? record.credits : 1;

        if (credits <= 0) {
          throw new Error('لقد استنفد هذا الكود كامل رصيد الاختبارات المتاح له. يرجى اقتناء باقة جديدة.');
        }

        // Establish active session
        setActiveKey({
          code: codeToVerify,
          credits: credits,
          columnName: detectedColumn
        });

        // Advance to designer
        setToolView('builder');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'فشلت عملية التحقق برمز التفعيل.';
      
      // Look for table mapping errors to show clear SQL guidance
      if (errMsg.includes('not_found_in_keycode')) {
        errMsg = 'لم يتم العثور على رمز التفعيل المطابق في قاعدة البيانات.';
      }
      setErrorText(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. File Upload Change Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorText(null);
    if (file.type !== 'application/pdf') {
      setErrorText('يرجى اختيار ملف مستند بصيغة PDF فقط.');
      return;
    }

    setUploadedFile(file);
    setPdfParsingProgress(0);

    try {
      const text = await extractTextFromPdf(file, (progress) => {
        setPdfParsingProgress(Math.min(100, Math.floor(progress * 100)));
      });

      if (!text || text.trim().length === 0) {
        throw new Error('تعذر قراءة أي كلمات صحيحة أو نصوص عربية من ملف الـ PDF. قد يكون المستند عبارة عن صور ممسوحة ضوئياً فقط.');
      }

      setExtractedPdfText(text);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'حدث خطأ مباغت أثناء تفكيك وقراءة ملف الـ PDF.');
      setUploadedFile(null);
    } finally {
      setPdfParsingProgress(null);
    }
  };

  // 3. AI Quiz Generation Request
  const handleGenerateQuiz = async () => {
    setErrorText(null);
    if (!activeKey) {
      setToolView('activate');
      setErrorText('يرجى تفعيل كود الباقة أولاً للوصول لميزات توليد الاختبارات.');
      return;
    }

    if (activeKey.credits <= 0) {
      setErrorText('رصيد الاختبارات غير كافٍ. يرجى تفعيل كود جديد.');
      return;
    }

    // Capture text payload
    let textToAnalyse = '';
    if (inputMethod === 'pdf') {
      if (!uploadedFile || !extractedPdfText) {
        setErrorText('يرجى رفع ملف PDF والانتظار حتى يتم استخراج المضمون العلمي.');
        return;
      }
      textToAnalyse = extractedPdfText;
    } else {
      if (!manualText.trim() || manualText.trim().length < 50) {
        setErrorText('يرجى لصق نص كافٍ (أكثر من 50 حرفاً) لتشكيل المادة العلمية للاختبار الذكي.');
        return;
      }
      textToAnalyse = manualText;
    }

    setIsGenerating(true);

    try {
      // Step A: Deduct 1 credit from database BEFORE representing results
      const newCreditsBalance = activeKey.credits - 1;

      if (!useSandbox) {
        const normalizeSupaUrl = (rawUrl: string): string => {
          let u = rawUrl.trim();
          while (u.endsWith('/')) {
            u = u.slice(0, -1);
          }
          if (u.endsWith('/rest/v1')) {
            u = u.slice(0, -8);
          } else if (u.endsWith('rest/v1')) {
            u = u.slice(0, -7);
          }
          while (u.endsWith('/')) {
            u = u.slice(0, -1);
          }
          return u;
        };

        const baseUrl = normalizeSupaUrl(supabaseConfig.url);
        const anonKey = supabaseConfig.anonKey.trim();
        const patchCol = activeKey.columnName || 'code';
        const patchUrl = `${baseUrl}/rest/v1/active_keys?${patchCol}=eq.${encodeURIComponent(activeKey.code)}`;

        const patchResponse = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ credits: newCreditsBalance })
        });

        if (!patchResponse.ok) {
          let errorMsg = '';
          try {
            const errBody = await patchResponse.json();
            errorMsg = errBody.message || errBody.error || JSON.stringify(errBody);
          } catch {
            errorMsg = `${patchResponse.status} ${patchResponse.statusText || ''}`;
          }
          throw new Error(`فشل تحديث الرصيد في قاعدة البيانات: ${errorMsg}`);
        }
      }

      // Locally update credit count
      setActiveKey({
        ...activeKey,
        credits: newCreditsBalance
      });

      // Step B: Send POST request to our Full-stack Express backend API securely
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToAnalyse,
          customKey: customGeminiKey // optional custom key override
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشلت عملية توليد الاختبار بالذكاء الاصطناعي.');
      }

      const generatedQuestions = await response.json();
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error('فشل توليد أسئلة متوافقة مع الهيكل المرجو. يرجى إدخال مادة علمية أوضح.');
      }

      setQuestions(generatedQuestions);
      setUserAnswers({});
      setQuizSubmitted(false);
      setToolView('quiz');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'حدث خطأ مفاجئ أثناء توليد الأسئلة.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Submit & Correct Quiz
  const handleSelectOption = (questionIndex: number, optionText: string) => {
    if (quizSubmitted) return; // locked after submission
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: optionText
    });
  };

  const handleCorrectQuiz = () => {
    // Audit that at least one question got answered for safety
    if (Object.keys(userAnswers).length === 0) {
      setErrorText('يرجى تحديد إجابة واحدة على الأقل قبل تصحيح الاختبار الدراسـي.');
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userAnswerText = userAnswers[idx];
      // Check if it matches correctAnswer exactly
      if (userAnswerText && userAnswerText.trim() === q.correctAnswer.trim()) {
        correctCount++;
      }
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);
    setErrorText(null);
    
    // Scroll to top of core layout for results visualization
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForNewQuiz = () => {
    setQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setUploadedFile(null);
    setExtractedPdfText('');
    setManualText('');
    setToolView('builder');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 font-sans relative">
      
      {/* 2. Beautiful Harmonious Educational Background Image Inside Tool Section */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-overlay opacity-[0.03] transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80')` 
        }} 
      />

      {/* Top Breadcrumb & Status Navigation with Premium Stepper Layout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-5 z-10 relative">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer self-start sm:self-auto group"
        >
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform" />
          العودة للرئيسية
        </button>

        {/* Stepper indicator pills */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
          <span className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            toolView === 'activate' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
          }`}>1. تنشيط الكود</span>
          <span className="text-slate-300 font-mono">/</span>
          <span className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            toolView === 'builder' ? 'bg-slate-900 text-white shadow-xs' : activeKey ? 'text-slate-800 font-bold' : 'text-slate-400'
          }`}>2. بناء وتوليد</span>
          <span className="text-slate-300 font-mono">/</span>
          <span className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            toolView === 'quiz' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400'
          }`}>3. الاختبار التقييمي</span>
        </div>

        {/* Key credentials container if active */}
        {activeKey && (
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-150 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-xs">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              كود نشط: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700">{activeKey.code}</code>
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1 text-slate-850">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
              الرصيد: 
              <span className="bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-md min-w-[20px] text-center border border-blue-100">
                {activeKey.credits}
              </span> 
              محاولات
            </span>
          </div>
        )}
      </div>

      {/* Database Setup Guideline and General Errors */}
      {errorText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-red-50 border border-red-100 text-red-800 rounded-3xl flex flex-col gap-4 text-sm font-medium shadow-sm z-10 relative"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-slate-950 text-sm">تنبيه النظام</p>
              <p className="text-red-700 font-light leading-relaxed">{errorText}</p>
            </div>
          </div>

          {(errorText.includes('class cache') || errorText.includes('cache') || errorText.includes('active_keys') || errorText.includes('جدول')) && (
            <div className="mt-2 bg-white/95 border border-red-200 rounded-2xl p-5 text-slate-700 font-light space-y-3 shadow-md">
              <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                💡 طريقة تهيئة الجدول في Supabase لإصلاح المشكلة فوراً:
              </p>
              <ol className="list-decimal list-inside text-xs space-y-2 text-slate-600 leading-normal pr-1">
                <li>افتح لوحة تحكم مشروعك في موقع <strong className="text-emerald-700 font-bold">Supabase</strong>.</li>
                <li>من القائمة الجانبية اليسرى للمشروع، اختر <strong className="text-indigo-600 font-bold">SQL Editor</strong>.</li>
                <li>اضغط على زر <strong className="text-indigo-600 font-bold">New Query</strong> لفتح محرر استعلام فارغ ومستقل.</li>
                <li>قم بنسخ كود الـ SQL المكتوب بالأسفل بالكامل، والصقه في المحرر، ثم اضغط على زر <strong className="bg-[#10b981] text-white px-2 py-0.5 rounded text-[10px] font-bold">Run</strong>.</li>
              </ol>

              <div className="relative mt-2">
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[10px] sm:text-[11px] font-mono overflow-x-auto text-left leading-normal whitespace-pre shadow-inner">
{`-- 1. إنشاء جدول أكواد التفعيل active_keys
CREATE TABLE public.active_keys (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  key_code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إدخال رمز تجريبي للتفعيل (يمكنك استخدامه مباشرة)
INSERT INTO public.active_keys (key_code, credits)
VALUES ('MOMEN2026', 100)
ON CONFLICT (key_code) DO NOTHING;

-- 3. تفعيل الحماية وتصاريح قراءة وتحديث الأرصدة للجميع
ALTER TABLE public.active_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.active_keys FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.active_keys FOR UPDATE USING (true);`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    const sqlText = `-- 1. إنشاء جدول أكواد التفعيل active_keys\nCREATE TABLE public.active_keys (\n  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n  key_code TEXT NOT NULL UNIQUE,\n  credits INTEGER NOT NULL DEFAULT 100,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n\n-- 2. إدخال رمز تجريبي للتفعيل (يمكنك استخدامه مباشرة)\nINSERT INTO public.active_keys (key_code, credits)\nVALUES ('MOMEN2026', 100)\nON CONFLICT (key_code) DO NOTHING;\n\n-- 3. تفعيل الحماية وتصاريح قراءة وتحديث الأرصدة للجميع\nALTER TABLE public.active_keys ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Allow public read" ON public.active_keys FOR SELECT USING (true);\nCREATE POLICY "Allow public update" ON public.active_keys FOR UPDATE USING (true);`;
                    navigator.clipboard.writeText(sqlText);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 2000);
                  }}
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {sqlCopied ? 'تم نسخ الجدول! ✓' : 'نسخ الكود'}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 font-light pr-1">
                * عند نجاح تثبيت الجدول في Supabase، عد إلى هذه الصفحة مباشرة وأدخل كود التجربة <code className="bg-slate-100 text-indigo-700 px-1 rounded font-bold font-mono">MOMEN2026</code> لتجربة باقة الاختبارات فورا وبشكل حي!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Transitions Canvas */}
      <AnimatePresence mode="wait">
        
        {/* VIEW A: Activate Key with Superb Premium Polish */}
        {toolView === 'activate' && (
          <motion.div
            key="activate-screen"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-lg mx-auto bg-white rounded-[32px] border border-slate-100 p-8 sm:p-10 flex flex-col relative overflow-hidden shadow-xl shadow-slate-100/60 z-10"
          >
            {/* Ambient visual overlay inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

            <div className="space-y-6 relative z-10">
              
              {/* Stepper badge */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="space-y-1">
                  <h2 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600 animate-pulse" />
                    تفعيل باقة الاختبارات
                  </h2>
                  <p className="text-xs text-slate-400 font-light">أدخل الرمز المستلم للاستفادة الكاملة من محرك الأسئلة الذكي</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest bg-slate-50 border px-2 py-1 rounded-md">Step 01</span>
              </div>

              {/* Activation Form with High Contrast Inputs */}
              <form onSubmit={handleVerifyKey} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">كود التفعيل المستلم</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      required
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder={useSandbox ? "أدخل DEMO100 للتجربة" : "MOMEN2026 أو الكود الخاص بك"}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center font-mono font-extrabold text-slate-900 tracking-wider text-md focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-350 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-7 py-4 rounded-2xl text-sm font-bold shadow-lg shadow-slate-950/10 hover:shadow-slate-950/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          المعالجة...
                        </>
                      ) : (
                        'تفعيل الآن'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Dynamic feedback under input */}
              {activationCode.trim() !== '' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-3.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-extrabold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900">الكود جاهز للتحقق الفوري</div>
                    <div className="text-[10px] text-blue-600/95 font-light">بمجرد الضغط على تفعيل الآن سنقوم بمطابقة الكود وحقن الرصيد.</div>
                  </div>
                </motion.div>
              )}

              {/* Callout support */}
              <div className="pt-4 border-t border-dashed border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  لا تملك كود تفعيل؟{' '}
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition duration-150 cursor-pointer"
                  >
                    انقر هنا لاقتناء كود بـ 19 ريالاً فقط
                  </button>
                </p>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW B: PDF Builder and Quiz Config with High Contrast Bento Design */}
        {toolView === 'builder' && (
          <motion.div
            key="builder-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 z-10 relative"
          >
            {/* Premium Header Banner */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1.5 text-right flex-1">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                  تم تنشيط المفتاح بنجاح!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-light leading-relaxed">
                  أنت الآن جاهز لرفع المادة التعليمية الخاصة بك وبناء الاختبار التفاعلي. مع كل اختبار تولده سيتم احتساب رصيد واحد.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 bg-slate-50 px-4 py-2 border rounded-xl font-medium text-xs text-slate-600 select-none">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>الحد الحالي: 15 سؤال قياس لكل ملزمة</span>
              </div>
            </div>

            {/* Config: Input Method Selector */}
            <div className="bg-slate-100/50 p-1 rounded-2xl max-w-sm flex border border-slate-200">
              <button
                onClick={() => setInputMethod('pdf')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  inputMethod === 'pdf' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                تحميل ملف PDF
              </button>
              <button
                onClick={() => setInputMethod('text')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  inputMethod === 'text' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardType className="w-4 h-4" />
                لصق نص يدوي
              </button>
            </div>

            {/* Primary Input Container */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 min-h-[340px] flex flex-col justify-center shadow-xs">
              
              {inputMethod === 'pdf' ? (
                /* PDF Loader with Interactive Progress indicator */
                <div className="space-y-4">
                  {pdfParsingProgress !== null ? (
                    <div className="text-center py-12 space-y-5">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-xs mx-auto">
                        <p className="text-sm font-bold text-slate-850">جاري مسح ومعالجة مستند الـ PDF...</p>
                        <p className="text-[11px] text-slate-400">نستخرج النصوص العربية بعناية وندرس المفاهيم</p>
                        
                        {/* Progress Indicator */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pdfParsingProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-black text-blue-600">{pdfParsingProgress}%</span>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    /* Display Selected Document Detail */
                    <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-right">
                        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 max-w-md truncate text-sm sm:text-md">{uploadedFile.name}</p>
                          <p className="text-xs text-slate-400 font-light">الحجم المستكشف: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت • تم سحب المضمون ووضعه رهن التوليد</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setExtractedPdfText('');
                        }}
                        className="py-2 px-4 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer shrink-0"
                      >
                        حذف وتغيير الملف
                      </button>
                    </div>
                  ) : (
                    /* Elegant Dropzone Wrapper */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-[24px] p-12 text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-3.5 ${
                        isDragging ? 'border-blue-500 bg-blue-50/20 scale-[0.99] shadow-inner' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/30'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                      />
                      <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100/50">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-850">اسحب وألقِ ملزمة الـ PDF هنا لرفعها</p>
                        <p className="text-xs text-slate-400 font-light">أو انقر لتصفح واختيار الملف من جهازك</p>
                      </div>
                      <span className="text-[10px] text-slate-350 font-medium">صيغ مدعومة: PDF فقط (بحد أقصى 20 ميجابايت)</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Area Custom Style */
                <div className="space-y-3 text-right">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">محتوى المادة العلمية</label>
                  <textarea
                    rows={8}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="ألصق هنا نصوص الدرس، الشروحات، أو الملاحظات التي ترغب بصياغة الاختبار منها..."
                    className="w-full p-5 bg-slate-50/50 border border-slate-150 focus:bg-white rounded-2xl text-sm leading-relaxed outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 transition-all resize-none placeholder:text-slate-300 text-slate-800"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium font-mono">
                    <span>الحد الأقصى المدعوم: 50,000 حرف</span>
                    <span>عدد الحروف المدخلة حالياً: {manualText.length} حرفاً</span>
                  </div>
                </div>
              )}

            </div>

            {/* Generate Trigger Button */}
            <div className="flex items-center justify-end z-10 relative">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || pdfParsingProgress !== null}
                className="w-full sm:w-auto px-10 py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer max-w-sm sm:max-w-none text-sm sm:text-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري صياغة الأسئلة بدقة (30 ثانية)...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5 text-indigo-400" />
                    توليد الاختبار الذكي الآن (سحب 1 محاولة)
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW C: Active Interactive Quiz Screen */}
        {toolView === 'quiz' && (
          <motion.div
            key="quiz-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 z-10 relative"
          >
            
            {/* Header Evaluation panel */}
            {quizSubmitted ? (
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="w-[88px] h-[88px] bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 mb-2">
                  <Award className="w-12 h-12 text-blue-600 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">اكتمل التقييم وتصحيح الإجابات بنجاح!</h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                    تمت معالجة الخيارات المحددة ومقارنتها بدقة وتفصيل مع النموذج الفكري المحكم للذكاء الاصطناعي.
                  </p>
                </div>
                
                <div className="inline-block py-2.5 px-8 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-xs">
                  <span className="text-xs sm:text-sm font-bold text-blue-900">
                    النتيجة النهائية: <span className="text-2xl font-extrabold text-blue-600 font-mono px-1">{quizScore}</span> من <span className="font-mono text-slate-700">15</span>
                  </span>
                </div>
                
                {/* Visual score statement */}
                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    {quizScore >= 13 ? '🏆 أداء استثنائي مذهل! يظهر فهمك المتكامل والعميق للمحتوى.' :
                     quizScore >= 9 ? '👍 مستوى رائع وجيد جداً! لديك عدد قليل جداً من الفجوات البسيطة.' :
                     '📖 فرصة قيمة ومثمرة للمذاكرة ومراجعة التفسيرات الموضحة أسفل كل سؤال للأخطاء.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 p-6 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 text-right">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    اختبار الفهم والتحليل الذاتي فوري
                  </h2>
                  <p className="text-xs text-slate-400 font-light">
                    أجب على جميع الأسئلة قياسية الاختيارات بالأسفل، ثم انقر على "مراجعة وتصحيح" لاستعراض تقديرك.
                  </p>
                </div>
                <div className="shrink-0 bg-slate-50 border px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 font-mono">
                  الأسئلة المحلولة: {Object.keys(userAnswers).length} / 15
                </div>
              </div>
            )}

            {/* Questions Container List */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => {
                const selectedAns = userAnswers[qIdx];
                const isCorrect = selectedAns && selectedAns.trim() === q.correctAnswer.trim();
                
                return (
                  <div 
                    key={qIdx}
                    id={`quiz-question-card-${qIdx}`}
                    className={`bg-white border rounded-[24px] p-6 sm:p-8 transition-all shadow-xs ${
                      quizSubmitted 
                        ? isCorrect 
                          ? 'border-emerald-200 bg-emerald-50/5' 
                          : 'border-red-200 bg-red-50/5'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    {/* Topic/Number Indicator */}
                    <div className="flex items-start gap-4 mb-4 text-right">
                      <span className="w-8 h-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h3 className="font-extrabold text-slate-850 text-sm sm:text-md pt-1 leading-relaxed">
                        {q.question}
                      </h3>
                    </div>

                    {/* Interactive Choices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mr-0 sm:mr-12">
                      {q.options.map((option, optIdx) => {
                        const isThisSelected = selectedAns === option;
                        const isThisCorrect = option === q.correctAnswer;
                        
                        // Option Styling State Logic
                        let optionStyle = 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700';
                        if (isThisSelected) {
                          optionStyle = 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold';
                        }
                        
                        if (quizSubmitted) {
                          if (isThisCorrect) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold';
                          } else if (isThisSelected) {
                            optionStyle = 'border-red-400 bg-red-50 text-red-900';
                          } else {
                            optionStyle = 'border-slate-100 bg-slate-50/20 opacity-60 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(qIdx, option)}
                            className={`p-4 border rounded-2xl text-right text-xs sm:text-sm transition-all flex items-center justify-between outline-none ${optionStyle} ${
                              !quizSubmitted ? 'cursor-pointer hover:-translate-y-0.5 active:scale-99' : ''
                            }`}
                            style={{ minHeight: '48px' }}
                          >
                            <span className="flex-1 pr-1 font-medium">{option}</span>
                            
                            {/* Boolean visual check indicator */}
                            <div className="shrink-0 pl-1">
                              {quizSubmitted ? (
                                isThisCorrect ? (
                                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                                ) : isThisSelected ? (
                                  <XCircle className="w-4.5 h-4.5 text-red-500" />
                                ) : null
                              ) : (
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isThisSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                }`}>
                                  {isThisSelected && <div className="w-1.5 h-1.5 bg-white rounded-full animate-scale" />}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory Scientific Help Feedback */}
                    {quizSubmitted && (
                      <div className="mt-5 mr-0 sm:mr-12 pt-4 border-t border-dashed border-slate-150">
                        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm ${
                          isCorrect ? 'bg-emerald-50/70 text-emerald-900' : 'bg-red-50/70 text-red-900'
                        }`}>
                          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-700' : 'text-red-650'}`} />
                          <div className="space-y-1.5 text-right">
                            <p className="font-bold">
                              {isCorrect ? 'رائع، إجابة صحيحة ومثالية!' : `للأسف إجابة خاطئة. الخيار الصحيح هو: "${q.correctAnswer}"`}
                            </p>
                            <p className="text-slate-650 font-light leading-relaxed">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Form */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              {quizSubmitted ? (
                /* Clear for next quiz generation */
                <>
                  <p className="text-xs text-slate-400 font-light text-right">
                    لقد تمت مراجعة المادة واكتمل التقييم. يمكنك توليد اختبار آخر جديد بخصم 1 محاولة من الرصيد النشط.
                  </p>
                  <button
                    onClick={handleResetForNewQuiz}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                    توليد اختبار ذكي جديد
                  </button>
                </>
              ) : (
                /* Perform correction request */
                <>
                  <p className="text-xs text-slate-400 font-light text-right">
                    ننصحك بالتحقق من مراجعة وتفقد الخيارات لجميع الـ 15 سؤالاً بالكامل قبل اعتماد التصحيح.
                  </p>
                  <button
                    onClick={handleCorrectQuiz}
                    className="w-full sm:w-auto px-10 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-md"
                  >
                    <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600" />
                    مراجعة وتصحيح الاختبار بالكامل وعرض النتيجة
                  </button>
                </>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
