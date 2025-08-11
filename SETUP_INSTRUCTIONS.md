# تعليمات إعداد مشروع Zen Store

## المتطلبات الأساسية

1. Node.js (v18 أو أحدث)
2. MongoDB
3. حساب Stripe للحصول على مفاتيح API

## إعداد Backend

### 1. تثبيت المتطلبات
```bash
cd backend
npm install
```

### 2. إعداد ملف البيئة
أنشئ ملف `.env` في مجلد `backend` بالمحتوى التالي:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/zen_store

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe URLs
SUCCESS_URL=http://localhost:3001/payment-success
CANCEL_URL=http://localhost:3001/packages

# Server
PORT=3000
NODE_ENV=development
```

### 3. تشغيل Backend
```bash
npm run start:dev
```

## إعداد Frontend

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. تشغيل Frontend
```bash
npm run dev
```

## إعداد Stripe

### 1. إنشاء حساب Stripe
- اذهب إلى [stripe.com](https://stripe.com)
- أنشئ حساب جديد
- احصل على مفاتيح API من لوحة التحكم

### 2. إعداد Webhook
- في لوحة تحكم Stripe، اذهب إلى Webhooks
- أنشئ webhook جديد بالرابط: `http://localhost:3000/order/webhook`
- اختر الأحداث: `checkout.session.completed`
- انسخ Webhook Secret وأضفه إلى ملف `.env`

## كيفية الاستخدام

### سيناريو الشراء الجديد:

1. **اختيار اللعبة**: المستخدم يختار لعبة من القائمة
2. **إدخال معلومات الحساب**: المستخدم يدخل ID اللعبة والمعلومات المطلوبة
3. **اختيار الباقة**: المستخدم يختار الباقة المطلوبة
4. **التحقق من تسجيل الدخول**: 
   - إذا لم يكن مسجل دخول، يظهر "تسجيل دخول للشراء"
   - إذا كان مسجل دخول، يظهر "شراء الباقة"
5. **الشراء**: 
   - يتم إنشاء طلب بحالة `pending`
   - يتم توجيه المستخدم إلى Stripe للدفع
   - بعد الدفع الناجح، يتم تحديث الطلب إلى `paid`
   - يتم توجيه المستخدم إلى صفحة النجاح

### الميزات الجديدة:

- ✅ التحقق من تسجيل الدخول قبل الشراء
- ✅ دفع واحد فقط (بطاقة ائتمان)
- ✅ تكامل مع Stripe
- ✅ إدارة حالة المستخدم
- ✅ صفحة نجاح الدفع
- ✅ عرض الطلبات في التاريخ

### API Endpoints المطلوبة:

- `POST /auth/login` - تسجيل الدخول
- `POST /order` - إنشاء طلب (يتطلب تسجيل دخول)
- `POST /order/:id/checkout` - إنشاء جلسة دفع Stripe
- `GET /order` - جلب طلبات المستخدم
- `POST /order/webhook` - استقبال webhook من Stripe

## ملاحظات مهمة

1. تأكد من تشغيل MongoDB قبل تشغيل Backend
2. تأكد من صحة مفاتيح Stripe
3. في بيئة الإنتاج، غيّر URLs إلى النطاق الصحيح
4. تأكد من إعداد CORS بشكل صحيح











