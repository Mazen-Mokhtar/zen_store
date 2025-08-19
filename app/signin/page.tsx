'use client';

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import GuestGuard from "@/components/guards/GuestGuard";
import { logger } from "@/lib/utils";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

// دالة ترجمة رسائل الأخطاء الشائعة
const errorMap: Record<string, string> = {
  "user already exist": "هذا البريد الإلكتروني مسجل بالفعل.",
  "In-valid-user": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Sorry confirm your email first 😔": "يرجى تفعيل بريدك الإلكتروني أولاً.",
  "Invalid OTP": "رمز التحقق غير صحيح.",
  "No OTP code found": "لم يتم العثور على رمز التحقق.",
  "OTP has expired": "انتهت صلاحية رمز التحقق.",
  "User not found or already confrimed": "المستخدم غير موجود أو تم تفعيل البريد مسبقاً.",
  "Invalid or expired reset token": "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.",
  // أضف المزيد حسب الحاجة
};

function translateError(msg: string) {
  // لو الرسالة فيها تفاصيل تقنية، خذ أول جزء فقط
  const cleanMsg = msg.split(":")[0].trim();
  return errorMap[cleanMsg] || msg;
}

export default function SignInPageDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Toast component
  const Toast = ({ message, type }: { message: string; type?: "error" | "success" }) => (
    <div className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-white transition-all animate-element ${type === "error" ? "bg-red-500" : "bg-green-500"}`}
      style={{ minWidth: 220 }}>
      {type === "error" ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      )}
      <span>{message}</span>
    </div>
  );

  const showError = (msg: string) => {
    setError(translateError(msg));
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setError(""), 3000);
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    // تحقق من صحة البيانات
    const email = (data.email || "").toString().trim();
    const password = (data.password || "").toString();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError("يرجى إدخال بريد إلكتروني صحيح");
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      showError("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
      setLoading(false);
      return;
    }
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        // نجح تسجيل الدخول
        showError("تم تسجيل الدخول بنجاح!");
        // انتقل إلى الصفحة السابقة أو صفحة الفئات
        const urlParams = new URLSearchParams(window.location.search);
        const rawReturnUrl = urlParams.get('returnUrl') || '/category';
        let returnUrl = rawReturnUrl;
        try {
          returnUrl = decodeURIComponent(rawReturnUrl);
        } catch {}
        router.push(returnUrl);
      } else {
        showError(result.error || "حدث خطأ أثناء تسجيل الدخول");
      }
    } catch (err: any) {
      showError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

const handleGoogleSignIn = () => {
  logger.log("Continue with Google clicked");
  alert("Continue with Google clicked");
};
  
  const handleResetPassword = () => {
    alert("Reset Password clicked");
  }

  const handleCreateAccount = () => {
    router.push("/signup");
  }

  return (
    <GuestGuard>
      <div className="bg-background text-foreground">
        <ThemeToggle />
        {error && <Toast message={error} type="error" />}
        <SignInPage
          heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
          testimonials={sampleTestimonials}
          onSignIn={handleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onResetPassword={handleResetPassword}
          onCreateAccount={handleCreateAccount}
        />
        {loading && <div className="text-center text-blue-500 mt-4">جاري تسجيل الدخول...</div>}
      </div>
    </GuestGuard>
  );
}