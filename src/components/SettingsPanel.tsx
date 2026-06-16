/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, X, Key, Database, CreditCard, RefreshCw, HelpCircle, AlertCircle } from 'lucide-react';
import { SupabaseConfig } from '../types';

interface SettingsPanelProps {
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: (config: SupabaseConfig) => void;
  paymentLink: string;
  setPaymentLink: (link: string) => void;
  customGeminiKey: string;
  setCustomGeminiKey: (key: string) => void;
  useSandbox: boolean;
  setUseSandbox: (sandbox: boolean) => void;
}

export default function SettingsPanel({
  supabaseConfig,
  setSupabaseConfig,
  paymentLink,
  setPaymentLink,
  customGeminiKey,
  setCustomGeminiKey,
  useSandbox,
  setUseSandbox,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Settings Button */}
      <button
        id="settings-trigger-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 p-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-full shadow-lg border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center cursor-pointer"
        title="إعدادات النظام"
      >
        <Settings className="w-6 h-6 animate-spin-hover" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          id="settings-backdrop"
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        id="settings-drawer"
        className={`fixed inset-y-0 left-0 w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto flex flex-col font-sans text-right dir-rtl`}
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-150 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">إعدادات لوحة التحكم</h2>
              <p className="text-xs text-slate-500">قم بتخصيص روابط الدفع وقواعد البيانات</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Sandbox Toggle */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  وضع المحاكاة والتجربة السريعة (Sandbox)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  عند تفعيل هذا الخيار، يمكنك تجربة الموقع بالكامل فوراً دون الحاجة لربط قاعدة بيانات Supabase حقيقية. استخدم الكود التجريبي: <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">DEMO100</code> لتمرير شاشة التفعيل الفوري والحصول على 5 أرصدة!
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2 pt-2 border-t border-blue-100/50">
              <input
                type="checkbox"
                checked={useSandbox}
                onChange={(e) => setUseSandbox(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-semibold text-blue-900 select-none">
                تمكين وضع المحاكاة التجريبية (موصى به للمراجعة السريعة)
              </span>
            </label>
          </div>

          {/* Payment Link Section */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              رابط الدفع الخارجي (PAYMENT_LINK)
            </label>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="https://salla.sa/your-payment-link"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-left font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              style={{ direction: 'ltr' }}
            />
            <p className="text-xs text-slate-400">
              هذا الرابط سيفتح بالتوجيه التلقائي عند نقر المستخدم على زر شراء الباقة في صفحة الهبوط.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Supabase Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1 border-slate-100">
              <Database className="w-4 h-4 text-teal-600" />
              ربط قاعدة بيانات Supabase (جدول active_keys)
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Supabase REST API URL</label>
              <input
                type="url"
                disabled={useSandbox}
                value={useSandbox ? 'https://sandbox.supabase.co' : supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                placeholder="https://xxxxxx.supabase.co"
                className="w-full p-2.5 bg-slate-50 disabled:opacity-60 border border-slate-200 rounded-lg text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                style={{ direction: 'ltr' }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Supabase Anon Key</label>
              <input
                type="password"
                disabled={useSandbox}
                value={useSandbox ? '••••••••••••••••••••••••' : supabaseConfig.anonKey}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 bg-slate-50 disabled:opacity-60 border border-slate-200 rounded-lg text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                style={{ direction: 'ltr' }}
              />
            </div>

            {!useSandbox && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  تعليمات بناء قاعدة البيانات في Supabase:
                </p>
                <p>1. قم بإنشاء جدول باسم <code className="bg-slate-200 px-1 rounded font-mono">active_keys</code></p>
                <p>2. أضف عمود الكود <code className="bg-slate-200 px-1 rounded font-mono">code</code> من نوع Text كحقل فريد (Primary/Unique)</p>
                <p>3. أضف عمود الرصيد <code className="bg-slate-200 px-1 rounded font-mono">credits</code> من نوع Integer مع قيمة افتراضية.</p>
                <p>4. تأكد من تفعيل صلاحيات RLS أو إعطاء سماحية القراءة (SELECT) والتعديل (UPDATE) لـ anon role.</p>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Optional Gemini Key Override */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-purple-600" />
              مفتاح Gemini API (اختياري)
            </label>
            <input
              type="password"
              value={customGeminiKey}
              onChange={(e) => setCustomGeminiKey(e.target.value)}
              placeholder="تلقائي عبر مجمع الـ Cloud السري"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              style={{ direction: 'ltr' }}
            />
            <p className="text-xs text-slate-400">
              بشكل تلقائي، يستخدم السيرفر مفتاح بيئة AI Studio الآمن المخفي في السحابة. يمكنك إدخال مفتاح مخصص هنا في حال الرغبة في تجاوزه.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-sm transition cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </>
  );
}
