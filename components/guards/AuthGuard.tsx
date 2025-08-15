"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";
import { notificationService } from "@/lib/notifications";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Ensure we never render protected content for unauthenticated users or expired sessions
    const isAuthed = authService.isAuthenticated();
    if (!isAuthed) {
      const search = searchParams?.toString();
      const returnUrl = encodeURIComponent(`${pathname}${search ? `?${search}` : ""}`);
      try {
        notificationService.warning("تسجيل الدخول مطلوب", "يرجى تسجيل الدخول للمتابعة");
      } catch {}
      router.replace(`/signin?returnUrl=${returnUrl}`);
      return;
    }

    setChecked(true);
  }, [pathname, searchParams, router]);

  useEffect(() => {
    // Cross-tab/session sync: if auth changes in another tab, respond here
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_token" || e.key === "auth_user" || e.key === null) {
        const isAuthed = authService.isAuthenticated();
        if (!isAuthed) {
          const search = searchParams?.toString();
          const returnUrl = encodeURIComponent(`${pathname}${search ? `?${search}` : ""}`);
          try {
            notificationService.warning("انتهت الجلسة", "تم تسجيل خروجك. يرجى تسجيل الدخول مرة أخرى");
          } catch {}
          router.replace(`/signin?returnUrl=${returnUrl}`);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname, searchParams, router]);

  if (!checked) return null;
  return <>{children}</>;
}