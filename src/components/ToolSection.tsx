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
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
          });
          if (response.ok) {
            data = await response.json();
            detectedColumn = 'key_code';
            // If it returned an empty list but the request succeeded, wait and check if we should fallback to code
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
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
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

            // Check if the error is "Could not find the table"
            if (errorMsg.includes('Could not find the table') || errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
              let availableTables: string[] = [];
              try {
                const specRes = await fetch(`${baseUrl}/rest/v1/`, {
                  method: 'GET',
                  headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                  }
                });
                if (specRes.ok) {
                  const specObj = await specRes.json();
                  if (specObj && specObj.paths) {
                    availableTables = Object.keys(specObj.paths)
                      .map(p => p.slice(1)) // remove leading '/'
                      .filter(p => p && p !== '/' && !p.startsWith('rpc/'));
                  }
                }
              } catch (specErr) {
                console.error('Failed to query Supabase OpenAPI spec:', specErr);
              }

              if (availableTables.length > 0) {
                const closeMatches = availableTables.filter(t => {
                  const lt = t.toLowerCase();
                  return lt === 'active_key' || lt === 'activekeys' || lt === 'active_key_codes' || lt === 'keys' || lt === 'key' || lt.includes('active') || lt.includes('key');
                });

                let suggestion = '';
                if (closeMatches.length > 0) {
                  suggestion = ` هل تقصد جدول: "${closeMatches.join(' أو ')}"؟ يرجى تسمية الجدول بدقة باسم "active_keys" أو تعديله.`;
                }

                throw new Error(`تعذر العثور على جدول 'active_keys' في قاعدة بيانات Supabase.${suggestion} الجداول المتاحة حالياً للوصول العام (anon) هي: [${availableTables.join(', ')}].`);
              } else {
                throw new Error(`تعذر العثور على جدول 'active_keys' في قاعدة بيانات Supabase. لا تتوفر أي جداول في الوصول العام (anon) بقاعدة البيانات حالياً. يرجى مراجعة الصلاحيات أو تفعيل جدول 'active_keys'.`);
              }
            }

            throw new Error(`فشل الاتصال بـ Supabase: ${errorMsg}`);
          }
          data = await response.json();
          detectedColumn = 'code';
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('كود التفعيل غير موجود بقاعدة البيانات. يرجى التحقق من المدخلات أو توليد كود مسبق.');
        }

        const keyRecord = data[0];
        const credits = Number(keyRecord.credits);

        if (isNaN(credits) || credits <= 0) {
          throw new Error('عذراً، هذا الكود مستهلك بالكامل ورصيده الحالي صفر.');
        }

        setActiveKey({
          code: codeToVerify,
          credits: credits,
          columnName: detectedColumn
        });
        setToolView('builder');
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'حدث خطأ في عملية التحقق.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorText(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        setErrorText('يرجى رفع ملف بصيغة PDF فقط.');
        return;
      }
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorText(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setUploadedFile(file);
    setPdfParsingProgress(1);
    setExtractedPdfText('');
    
    try {
      const extractedText = await extractTextFromPdf(file, (progress) => {
        setPdfParsingProgress(progress);
      });
      setExtractedPdfText(extractedText);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'حدث خطأ أثناء معالجة ملف الـ PDF. يرجى التحقق من سلامة الملف.');
      setUploadedFile(null);
    } finally {
      setPdfParsingProgress(null);
    }
  };

  // 3. Quiz Generation Trigger (Deduct credit & call backend)
  const handleGenerateQuiz = async () => {
    setErrorText(null);
    if (!activeKey) return;

    // Check localized credit balance
    if (activeKey.credits <= 0) {
      setErrorText('لا يوجد رصيد كافٍ في الكود لتوليد الاختبار.');
      return;
    }

    // Capture text payload
    let textToAnalyse = '';
    if (inputMethod === 'pdf') {
      if (!uploadedFile || !extractedPdfText) {
        setErrorText('يرجى رفع ملف PDF والانتظار حتى يتم استخراج النص.');
        return;
      }
      textToAnalyse = extractedPdfText;
    } else {
      if (!manualText.trim() || manualText.trim().length < 50) {
        setErrorText('يرجى لصق نص كافٍ (أكثر من 50 حرفاً) لتوليد اختبار دقيق.');
        return;
      }
      textToAnalyse = manualText;
    }

    setIsGenerating(true);

    try {
      // Step A: Deduct 1 credit from database BEFORE representing results as requested!
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
          throw new Error(`فشل تحديث الخصم في قاعدة البيانات: ${errorMsg}`);
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
      setErrorText('يرجى تحديد إجابة واحدة على الأقل قبل تصحيح الاختبار.');
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 font-sans">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>

        {activeKey && (
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              كود التفعيل: <code className="bg-slate-200 px-1 rounded font-mono text-indigo-700">{activeKey.code}</code>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              الرصيد المتبقي: 
              <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                {activeKey.credits}
              </span> 
              الاختبارات
            </span>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {errorText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex flex-col gap-3 text-sm font-medium"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold">تنبيه النظام</p>
              <p className="text-red-600 font-light leading-relaxed">{errorText}</p>
            </div>
          </div>

          {(errorText.includes('class cache') || errorText.includes('cache') || errorText.includes('active_keys') || errorText.includes('جدول')) && (
            <div className="mt-2 bg-white/90 border border-red-200 rounded-xl p-4 text-slate-700 font-light space-y-3 shadow-sm">
              <p className="font-bold text-slate-900 text-xs sm:text-sm">💡 طريقة تهيئة الجدول في Supabase لإصلاح المشكلة:</p>
              <ol className="list-decimal list-inside text-xs space-y-1.5 text-slate-600">
                <li>افتح لوحة تحكم مشروعك في <strong className="text-emerald-700">Supabase</strong>.</li>
                <li>من القائمة الجانبية اليسرى، اختر <strong className="text-indigo-600">SQL Editor</strong>.</li>
                <li>اضغط على زر <strong className="text-indigo-600">New Query</strong> لفتح محرر استعلام فارغ.</li>
                <li>انسخ الكود الجاهز بالأسفل والصقه في المحرر، ثم اضغط على زر <strong className="bg-[#10b981] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">Run</strong> لتشغيل الاستعلام.</li>
              </ol>

              <div className="relative mt-2">
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[10px] sm:text-[11px] font-mono overflow-x-auto text-left leading-normal whitespace-pre">
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
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white rounded px-2.5 py-1 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {sqlCopied ? 'تم نسخ الجدول! ✓' : 'نسخ الكود'}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 font-light mt-1">
                * ملاحظة: بمجرد نجاح تشغيل الاستعلام، يمكنك تشغيل واختبار كود التحديث والتفعيل مباشرة بدون أي أخطاء!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Transitions Canvas */}
      <AnimatePresence mode="wait">
        
        {/* VIEW A: Activate Key */}
        {toolView === 'activate' && (
          <motion.div
            key="activate-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md mx-auto bg-[#F9FAFB] rounded-[36px] border border-gray-100 p-8 flex flex-col relative overflow-hidden select-none"
            style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.015)' }}
          >
            {/* Blurry corner decor inspired by the minimalism mockup */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6 z-10">
              <div className="flex items-center justify-between pb-1">
                <h2 className="font-extrabold text-[#111827] text-lg">تفعيل الأداة</h2>
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">Step 01</span>
              </div>

              <form onSubmit={handleVerifyKey} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">كود التفعيل</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder={useSandbox ? "أدخل DEMO100 للتجربة" : "XXXX-XXXX-XXXX"}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-center font-bold tracking-widest text-[#111827] focus:bg-white focus:outline-none focus:border-blue-500 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-300"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'تحقق'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Verified Badge placeholder illustration */}
              {activationCode.trim() !== '' && (
                <div className="pt-4 border-t border-dashed border-gray-200">
                  <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">✓</div>
                    <div>
                      <div className="text-xs font-bold text-blue-900">تم التعرف على الكود</div>
                      <div className="text-[10px] text-blue-700">اضغط "تحقق" لتفعيله والاستمرار فوراً</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-2 text-center z-10">
              <p className="text-xs text-gray-400">
                ليس لديك كود؟{' '}
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition duration-150 cursor-pointer"
                >
                  انقر لاقتناء باقة تفعيل بـ 19 ريالاً فقط
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW B: PDF Builder and Quiz Config */}
        {toolView === 'builder' && (
          <motion.div
            key="builder-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Instruction Banner - Clean Minimalism */}
            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6">
              <h2 className="text-lg font-extrabold text-[#111827] mb-1.5 flex items-center gap-2">
                <span className="w-5.5 h-5.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">✓</span>
                جاهز لتوليد الاختبار الذكي الأول!
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl leading-relaxed">
                حدد طريقة تزويد المادة العلمية بالأسفل. يمكنك سحب وإفلات ملازم المذاكرة والكتب بصيغة PDF وسيقوم روبوت الذكاء الاصطناعي ببناء 15 سؤالاً بنموذج الإجابة والتحليل الواضح فوراً بخصم محتسب رصيد واحد.
              </p>
            </div>

            {/* Selector Input Method */}
            <div className="flex bg-[#F3F4F6] p-1.5 rounded-xl max-w-sm">
              <button
                onClick={() => setInputMethod('pdf')}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  inputMethod === 'pdf' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-blue-600' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                رفع ملف PDF
              </button>
              <button
                onClick={() => setInputMethod('text')}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  inputMethod === 'text' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-blue-600' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <ClipboardType className="w-4 h-4" />
                لصق نص يدوي
              </button>
            </div>

            {/* Input Form Body */}
            <div className="bg-white border border-gray-100 rounded-[24px] p-6 min-h-[300px] flex flex-col justify-center">
              
              {inputMethod === 'pdf' ? (
                /* PDF Reader Form */
                <div className="space-y-4">
                  {pdfParsingProgress !== null ? (
                    <div className="text-center py-12 space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <p className="text-sm font-bold text-slate-700">جاري قراءة وتحليل ملف الـ PDF...</p>
                        <p className="text-xs text-slate-400">استخراج الكلمات العربية من الصفحات بسلاسة</p>
                        
                        {/* Progress Bar Container */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${pdfParsingProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600">{pdfParsingProgress}%</span>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    /* Display File Loaded */
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 max-w-md truncate">{uploadedFile.name}</p>
                          <p className="text-xs text-slate-500">حجم الملف: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setExtractedPdfText('');
                        }}
                        className="py-1.5 px-3 bg-white border hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg text-xs font-bold text-slate-500 transition cursor-pointer"
                      >
                        إلغاء الملف
                      </button>
                    </div>
                  ) : (
                    /* Dropzone screen - Clean Minimalism dashed button styles */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                        isDragging ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/40'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                      />
                      <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-3">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#111827]">اسحب وألقِ ملزمة الـ PDF هنا</p>
                      <p className="text-xs text-gray-400 mt-1">أو انقر لاختيار الملف من الجهاز</p>
                      <p className="text-[11px] text-gray-300 mt-3 font-medium">الحد الأقصى للحجم 20 ميجابايت.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Area Form - Clean light styling */
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">أدخل المحتوى العلمي أو التلخيص يدوياً</label>
                  <textarea
                    rows={8}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="ألصق شرح الدرس هنا... يرجى توفير نص علمي كافٍ (نحو صفحة واحدة على الأقل) للحصول على أفضل توليد ممكن."
                    className="w-full p-4 bg-gray-50/40 border border-gray-150 focus:bg-white rounded-xl text-sm leading-relaxed outline-none focus:border-blue-500 transition-all resize-none placeholder:text-gray-300 text-slate-800"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>الحد المقترح: حتى 50,000 حرف</span>
                    <span>عدد الحروف المدخلة: {manualText.length} حرفاً</span>
                  </div>
                </div>
              )}

            </div>

            {/* Command Trigger Zone - Dark Minimalist Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || pdfParsingProgress !== null}
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-gray-100 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري توليد الاختبار بالكامل خلال 30 ثانية...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    توليد الاختبار الآن (خصم 1 رصيد)
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
            className="space-y-8"
          >
            
            {/* Header / Submission Score banner */}
            {quizSubmitted ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center space-y-4">
                <div className="w-[84px] h-[84px] bg-white rounded-full flex items-center justify-center mx-auto shadow-md border border-blue-100">
                  <Award className="w-12 h-12 text-blue-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">اكتمل التقييم وتصحيح الإجابات!</h2>
                  <p className="text-sm text-slate-500">تم مراجعة إجاباتك ومقارنتها بالإجابات النموذجية المستخلصة ببراعة.</p>
                </div>
                <div className="inline-block py-2 px-6 bg-white rounded-full border border-blue-200/60 shadow-xs">
                  <span className="text-md text-slate-600 font-bold">
                    النتيجة النهائية: <span className="text-2xl font-black text-blue-600 px-1 font-mono">{quizScore}</span> من <span className="font-mono text-slate-700">15</span>
                  </span>
                </div>
                
                {/* Visual evaluation statement */}
                <div className="pt-2">
                  <p className="text-xs text-slate-500">
                    {quizScore >= 13 ? '🏆 أداء استثنائي رائع! أنت تتقن المادة العلمية بالكامل.' :
                     quizScore >= 9 ? '👍 أداء جيد جداً! لديك فهم عميق مع بضعة نقاط بسيطة للتحسين.' :
                     '📖 فرصة مثالية للمراجعة! راجع التفسيرات والتفسير التفصيلي لكل سؤال أسفله.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    اختبار قياس الذاتي الفوري
                  </h2>
                  <p className="text-xs text-slate-500">
                    قم بحل الـ 15 سؤالاً التالية بالكامل ثم انقر على "تصحيح الاختبار" بأخر الصفحة لعرض الدرجة.
                  </p>
                </div>
                <div className="shrink-0 bg-white border text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600">
                  الأسئلة المجابة: {Object.keys(userAnswers).length} / 15
                </div>
              </div>
            )}

            {/* Questions List Render */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => {
                const selectedAns = userAnswers[qIdx];
                const isCorrect = selectedAns && selectedAns.trim() === q.correctAnswer.trim();
                
                return (
                  <div 
                    key={qIdx}
                    id={`quiz-question-card-${qIdx}`}
                    className={`bg-white border rounded-2xl p-6 transition-all shadow-xs ${
                      quizSubmitted 
                        ? isCorrect 
                          ? 'border-emerald-200 bg-emerald-50/5' 
                          : 'border-red-200 bg-red-50/5'
                        : 'border-slate-150 hover:shadow-md'
                    }`}
                  >
                    {/* Header: Question Text */}
                    <div className="flex items-start gap-4 mb-4">
                      <span className="w-7 h-7 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-md pt-0.5 leading-relaxed">
                        {q.question}
                      </h3>
                    </div>

                    {/* Options Body */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mr-11">
                      {q.options.map((option, optIdx) => {
                        const isThisSelected = selectedAns === option;
                        const isThisCorrect = option === q.correctAnswer;
                        
                        // Color styling logic after submission
                        let optionStyle = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700';
                        if (isThisSelected) {
                          optionStyle = 'border-blue-500 bg-blue-50 text-blue-900';
                        }
                        
                        if (quizSubmitted) {
                          if (isThisCorrect) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          } else if (isThisSelected) {
                            optionStyle = 'border-red-500 bg-red-50 text-red-900';
                          } else {
                            optionStyle = 'border-slate-100 bg-slate-50/40 opacity-70 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(qIdx, option)}
                            className={`p-3 border rounded-xl text-right text-xs sm:text-sm transition-all focus:outline-none flex items-center justify-between ${optionStyle} ${
                              !quizSubmitted ? 'cursor-pointer hover:scale-101' : ''
                            }`}
                          >
                            <span className="flex-1 pr-1">{option}</span>
                            
                            {/* Option Checkbox indicators */}
                            <div className="shrink-0 pl-1">
                              {quizSubmitted ? (
                                isThisCorrect ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                ) : isThisSelected ? (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                ) : null
                              ) : (
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isThisSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                }`}>
                                  {isThisSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory feedback */}
                    {quizSubmitted && (
                      <div className="mt-4 mr-11 pt-4 border-t border-dashed border-slate-100 space-y-2">
                        <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm ${
                          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                        }`}>
                          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`} />
                          <div className="space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              {isCorrect ? 'إجابة صحيحة!' : `للأسف، الإجابة غير دقيقة. الإجابة الصحيحة هي: "${q.correctAnswer}"`}
                            </p>
                            <p className="text-slate-600 font-light leading-relaxed">{q.explanation}</p>
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
                /* Post-Submission reset options */
                <>
                  <p className="text-xs text-slate-400">
                    يمكنك اختيار توليد اختبار رائع آخر بخصم رصيد واحد إضافي من سلة الرصيد.
                  </p>
                  <button
                    onClick={handleResetForNewQuiz}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    توليد اختبار جديد من ملزمة أخرى
                  </button>
                </>
              ) : (
                /* Perform correction request */
                <>
                  <p className="text-xs text-slate-400">
                    تأكد من اختيار الخيارات الأنسب لجميع الأسئلة قبل إجراء التصحيح التلقائي.
                  </p>
                  <button
                    onClick={handleCorrectQuiz}
                    className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600" />
                    تصحيح الاختبار بالكامل وعرض النتيجة
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
