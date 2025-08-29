# دليل الأمان - ZenStore

## 🔒 الملفات الحساسة المحمية

تم حماية الملفات التالية من الرفع إلى Git:

### ملفات البيئة (.env)
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `backend/.env`

### ملفات الاختبار والبيانات الحساسة
- `cookies.txt`
- `test_login.json`
- `test_signup.json`
- `*.log`
- `*.key`
- `*.pem`
- `*.p12`
- `*.pfx`

## 🛡️ ميزات الأمان المطبقة

### 1. إدارة الجلسات الآمنة
- جلسات مبنية على الـ backend
- انتهاء صلاحية تلقائي للجلسات
- مراقبة الجلسات في الوقت الفعلي
- إمكانية إنهاء جميع الجلسات الأخرى

### 2. الحماية من CSRF
- توليد وتحقق من CSRF tokens
- حماية جميع النماذج
- تحديث تلقائي للـ tokens

### 3. تحديد معدل الطلبات (Rate Limiting)
- حماية من الهجمات المتكررة
- تحديد عدد الطلبات لكل IP
- حماية APIs الحساسة

### 4. معالجة الأخطاء الآمنة
- عدم كشف معلومات حساسة في الأخطاء
- تسجيل آمن للأخطاء
- رسائل خطأ عامة للمستخدمين

### 5. مراقبة الأمان
- تسجيل جميع الأنشطة الأمنية
- تنبيهات للأنشطة المشبوهة
- لوحة تحكم أمنية للإدارة

## 📋 قائمة التحقق قبل النشر

### ✅ تم التحقق منها
- [x] جميع ملفات .env محمية
- [x] الملفات الحساسة مضافة إلى .gitignore
- [x] إزالة الملفات الحساسة من Git history
- [x] تطبيق HTTPS في الإنتاج
- [x] تشفير كلمات المرور
- [x] حماية CSRF
- [x] Rate limiting
- [x] معالجة آمنة للأخطاء

### 🔧 متطلبات الإعداد

#### متغيرات البيئة المطلوبة:
```bash
# Database
DB_URL=mongodb://localhost:27017/zenstore

# JWT
JWT_SECRET=your_secure_jwt_secret_here
SIGNATURE_USER=your_user_signature
SIGNATURE_ADMIN=your_admin_signature
SIGNATURE_SUPER_ADMIN=your_superadmin_signature
SIGNATURE_REFRESH=your_refresh_signature

# Email
EMAIL=your_email@example.com
EMAIL_PASS=your_email_password

# Cloudinary
CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

# Stripe
STRIPE_SECRET=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Security
PHONE_ENC=your_phone_encryption_key
SALT=10
```

## 🚨 تحذيرات مهمة

1. **لا تشارك ملفات .env أبداً**
2. **استخدم كلمات مرور قوية للإنتاج**
3. **فعّل HTTPS في الإنتاج**
4. **راجع السجلات الأمنية بانتظام**
5. **حدّث التبعيات بانتظام**

## 📞 الإبلاغ عن مشاكل أمنية

إذا وجدت مشكلة أمنية، يرجى عدم فتح issue عام. بدلاً من ذلك:
1. أرسل بريد إلكتروني إلى: security@zenstore.com
2. أو تواصل مع المطور مباشرة

---

**آخر تحديث:** يناير 2025
**الإصدار:** 1.0.0