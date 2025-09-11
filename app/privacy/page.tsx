'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <Shield className="h-12 w-12 text-white" />
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              سياسة الخصوصية - Wivz
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-purple-100"
          >
            نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8"
        >
          {/* Introduction */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">مقدمة</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              مرحباً بك في Wivz. نحن نقدر ثقتك بنا ونلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. 
              تشرح هذه السياسة كيفية جمعنا واستخدامنا وحماية المعلومات التي تقدمها لنا عند استخدام خدماتنا.
            </p>
          </div>

          {/* Data Collection */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">البيانات التي نجمعها</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">المعلومات الشخصية:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>الاسم الكامل</li>
                  <li>عنوان البريد الإلكتروني</li>
                  <li>رقم الهاتف</li>
                  <li>معلومات الحساب المصرفي (مشفرة)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">معلومات الاستخدام:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>عنوان IP</li>
                  <li>نوع المتصفح ونظام التشغيل</li>
                  <li>صفحات الموقع التي تزورها</li>
                  <li>وقت وتاريخ الزيارة</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Usage */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">كيف نستخدم بياناتك</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mr-4">
              <li>معالجة طلباتك وتقديم الخدمات المطلوبة</li>
              <li>التواصل معك بخصوص طلباتك أو استفساراتك</li>
              <li>تحسين خدماتنا وتجربة المستخدم</li>
              <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
              <li>منع الاحتيال وضمان أمان المنصة</li>
            </ul>
          </div>

          {/* Data Protection */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-white">حماية البيانات</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                نستخدم أحدث تقنيات الأمان لحماية بياناتك، بما في ذلك:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>تشفير SSL/TLS لجميع عمليات نقل البيانات</li>
                <li>تشفير قواعد البيانات</li>
                <li>مراقبة أمنية على مدار الساعة</li>
                <li>نسخ احتياطية منتظمة ومؤمنة</li>
                <li>تحديثات أمنية دورية</li>
              </ul>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">مشاركة البيانات</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p className="font-medium text-white">
                نحن لا نبيع أو نؤجر أو نشارك بياناتك الشخصية مع أطراف ثالثة، باستثناء:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>مقدمي خدمات الدفع المعتمدين (بيانات مشفرة فقط)</li>
                <li>السلطات القانونية عند الطلب الرسمي</li>
                <li>شركاء الخدمة الضروريين لتشغيل المنصة (بموجب اتفاقيات سرية)</li>
              </ul>
            </div>
          </div>

          {/* User Rights */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">حقوقك</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mr-4">
              <li>الحق في الوصول إلى بياناتك الشخصية</li>
              <li>الحق في تصحيح البيانات غير الصحيحة</li>
              <li>الحق في حذف بياناتك (وفقاً للقوانين المعمول بها)</li>
              <li>الحق في تقييد معالجة بياناتك</li>
              <li>الحق في نقل بياناتك</li>
              <li>الحق في الاعتراض على معالجة بياناتك</li>
            </ul>
          </div>

          {/* Cookies */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">ملفات تعريف الارتباط (Cookies)</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. يمكنك التحكم في هذه الملفات من خلال إعدادات متصفحك.
              </p>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">أنواع ملفات تعريف الارتباط:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>ملفات ضرورية لتشغيل الموقع</li>
                  <li>ملفات تحليلية لفهم استخدام الموقع</li>
                  <li>ملفات وظيفية لحفظ تفضيلاتك</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">اتصل بنا</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                إذا كان لديك أي أسئلة حول سياسة الخصوصية أو ترغب في ممارسة حقوقك، يرجى التواصل معنا:
              </p>
              <div className="space-y-2">
                <p><strong className="text-white">البريد الإلكتروني:</strong> privacy@wivz.com</p>
                <p><strong className="text-white">الهاتف:</strong> +20 123 456 7890</p>
                <p><strong className="text-white">العنوان:</strong> القاهرة، مصر</p>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">تحديثات السياسة</h2>
            </div>
            <p className="text-gray-300">
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر البريد الإلكتروني أو من خلال إشعار على موقعنا.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-8">
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white font-medium transition-all duration-300 hover:from-purple-700 hover:to-blue-700"
            >
              العودة للصفحة الرئيسية
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}