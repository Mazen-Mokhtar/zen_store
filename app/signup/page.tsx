"use client";

import React from "react";
import FormLayout01 from "@/components/ui/form-2";
import { Meteors } from "@/components/ui/meteors";
import GuestGuard from "@/components/guards/GuestGuard";

export default function SignupPage() {
  return (
    <GuestGuard>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-950 overflow-hidden">
        {/* Meteors background */}
        <div className="absolute inset-0 pointer-events-none">
          <Meteors number={30} />
        </div>
        {/* Signup form */}
        <div className="relative z-10">
          <FormLayout01 />
        </div>
      </div>
    </GuestGuard>
  );
}