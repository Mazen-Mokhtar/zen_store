'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle, XCircle, Users, CreditCard, Shield } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <Scale className="h-12 w-12 text-white" />
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              شروط الخدمة
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-blue-100"
          >
            الشروط والأحكام التي تحكم استخدام خدماتنا
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
              <FileText className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">مقدمة</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              مرحباً بك في Wivz. باستخدامك لخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
              يرجى قراءة هذه الشروط بعناية قبل استخدام منصتنا. إذا كنت لا توافق على أي من هذه الشروط، 
              فيرجى عدم استخدام خدماتنا.
            </p>
          </div>

          {/* Service Description */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">وصف الخدمة</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Wivz هي منصة إلكترونية تقدم خدمات شحن الألعاب والاشتراكات الرقمية. نحن نوفر:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>شحن حسابات الألعاب المختلفة</li>
                <li>بيع الاشتراكات الرقمية</li>
                <li>خدمات الدفع الآمنة</li>
                <li>دعم فني على مدار الساعة</li>
              </ul>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">مسؤوليات المستخدم</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p className="font-medium text-white mb-2">بصفتك مستخدماً لخدماتنا، فإنك توافق على:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                <li>الحفاظ على سرية بيانات حسابك</li>
                <li>عدم استخدام الخدمة لأغراض غير قانونية</li>
                <li>عدم محاولة اختراق أو إلحاق الضرر بالمنصة</li>
                <li>احترام حقوق الملكية الفكرية</li>
                <li>عدم إنشاء حسابات متعددة بهدف الاحتيال</li>
                <li>الالتزام بقوانين بلدك المحلية</li>
              </ul>
            </div>
          </div>

          {/* Prohibited Activities */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">الأنشطة المحظورة</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p className="font-medium text-white mb-2">يُحظر عليك القيام بما يلي:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>استخدام الخدمة لغسيل الأموال أو التمويل غير القانوني</li>
                <li>بيع أو نقل حسابك لأطراف ثالثة</li>
                <li>استخدام برامج آلية أو روبوتات</li>
                <li>محاولة الوصول غير المصرح به لأنظمتنا</li>
                <li>نشر محتوى مسيء أو غير لائق</li>
                <li>انتحال شخصية أشخاص آخرين</li>
                <li>التلاعب في أسعار أو عروض الخدمة</li>
              </ul>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-white">شروط الدفع</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">طرق الدفع المقبولة:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>البطاقات الائتمانية والخصم</li>
                  <li>المحافظ الإلكترونية</li>
                  <li>التحويلات البنكية</li>
                  <li>العملات الرقمية المعتمدة</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">شروط الدفع:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>جميع الأسعار معروضة بالعملة المحلية</li>
                  <li>الدفع مطلوب قبل تنفيذ الخدمة</li>
                  <li>قد تطبق رسوم إضافية حسب طريقة الدفع</li>
                  <li>نحتفظ بالحق في تغيير الأسعار مع إشعار مسبق</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">سياسة الاسترداد</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">حالات الاسترداد:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>فشل في تسليم الخدمة خلال الوقت المحدد</li>
                  <li>خطأ تقني من جانبنا</li>
                  <li>إلغاء الطلب قبل التنفيذ (حسب نوع الخدمة)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">شروط الاسترداد:</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>يجب تقديم طلب الاسترداد خلال 24 ساعة</li>
                  <li>تقديم دليل على عدم استلام الخدمة</li>
                  <li>الاسترداد يتم خلال 3-7 أيام عمل</li>
                  <li>قد تطبق رسوم معالجة في بعض الحالات</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Service Availability */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">توفر الخدمة</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                نسعى لتوفير خدماتنا على مدار الساعة، ولكن قد تحدث انقطاعات مؤقتة بسبب:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>الصيانة المجدولة</li>
                <li>التحديثات التقنية</li>
                <li>ظروف خارجة عن سيطرتنا</li>
                <li>مشاكل في خدمات الطرف الثالث</li>
              </ul>
              <p className="mt-4">
                سنبذل قصارى جهدنا لإشعارك مسبقاً بأي انقطاع مخطط له.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">تحديد المسؤولية</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                في حدود ما يسمح به القانون، فإن مسؤوليتنا محدودة بما يلي:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>لا نتحمل مسؤولية الأضرار غير المباشرة</li>
                <li>مسؤوليتنا القصوى محدودة بقيمة الخدمة المشتراة</li>
                <li>لا نضمن عدم انقطاع الخدمة</li>
                <li>لا نتحمل مسؤولية أفعال الأطراف الثالثة</li>
                <li>المستخدم مسؤول عن أمان حسابه</li>
              </ul>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">الملكية الفكرية</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                جميع المحتويات والعلامات التجارية والتصاميم الموجودة على منصتنا محمية بحقوق الطبع والنشر. 
                يُحظر استخدامها دون إذن كتابي مسبق.
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4 mt-4">
                <li>شعار وعلامة Wivz التجارية</li>
                <li>تصميم وواجهة الموقع</li>
                <li>المحتوى النصي والمرئي</li>
                <li>البرمجيات والأكواد</li>
              </ul>
            </div>
          </div>

          {/* Termination */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">إنهاء الخدمة</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                نحتفظ بالحق في إنهاء أو تعليق حسابك في الحالات التالية:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>انتهاك شروط الخدمة</li>
                <li>النشاط المشبوه أو الاحتيالي</li>
                <li>عدم الدفع أو رد المبالغ المستحقة</li>
                <li>استخدام الخدمة لأغراض غير قانونية</li>
              </ul>
              <p className="mt-4">
                يمكنك أيضاً إنهاء حسابك في أي وقت بالتواصل مع خدمة العملاء.
              </p>
            </div>
          </div>

          {/* Governing Law */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">القانون المطبق</h2>
            </div>
            <p className="text-gray-300">
              تخضع هذه الشروط والأحكام لقوانين جمهورية مصر العربية. أي نزاع ينشأ عن استخدام خدماتنا 
              سيتم حله وفقاً للقوانين المصرية والمحاكم المختصة في القاهرة.
            </p>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">معلومات الاتصال</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                إذا كان لديك أي أسئلة حول شروط الخدمة، يرجى التواصل معنا:
              </p>
              <div className="space-y-2">
                <p><strong className="text-white">البريد الإلكتروني:</strong> legal@wivz.com</p>
                <p><strong className="text-white">خدمة العملاء:</strong> support@wivz.com</p>
                <p><strong className="text-white">الهاتف:</strong> +20 123 456 7890</p>
                <p><strong className="text-white">العنوان:</strong> القاهرة، مصر</p>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">تحديثات الشروط</h2>
            </div>
            <p className="text-gray-300">
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سنقوم بإشعارك بأي تغييرات مهمة 
              عبر البريد الإلكتروني أو من خلال إشعار على موقعنا. استمرارك في استخدام الخدمة بعد 
              التحديثات يعني موافقتك على الشروط الجديدة.
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
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
            >
              العودة للصفحة الرئيسية
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}