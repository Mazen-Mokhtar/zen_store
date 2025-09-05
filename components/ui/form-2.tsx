"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import Link from "next/link";
import InputSanitizer, { useInputValidation } from '../security/InputSanitizer';
import CSRFProtection from '../security/CSRFProtection';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef<
  any,
  React.ComponentPropsWithoutRef<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
Label.displayName = LabelPrimitive.Root.displayName;

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  );
}
Separator.displayName = SeparatorPrimitive.Root.displayName;

function FormLayout01() {
  const [form, setForm] = React.useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
    cPassword: "",
  });
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const { errors, validateInput, clearErrors, hasErrors } = useInputValidation();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    clearErrors();
    
    // Validate all inputs
    const isUserNameValid = validateInput('userName', form.userName, {
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_]+$/,
      custom: (value) => {
        if (value.includes('admin') || value.includes('root')) {
          return 'اسم المستخدم غير مسموح';
        }
        return null;
      }
    });
    
    const isEmailValid = validateInput('email', form.email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    
    const isPhoneValid = validateInput('phone', form.phone, {
      required: true,
      pattern: /^[+]?[0-9]{10,15}$/
    });
    
    const isPasswordValid = validateInput('password', form.password, {
      required: true,
      minLength: 8,
      custom: (value) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم';
        }
        return null;
      }
    });
    
    const isConfirmPasswordValid = validateInput('cPassword', form.cPassword, {
      required: true,
      custom: (value) => {
        if (value !== form.password) {
          return 'كلمات المرور غير متطابقة';
        }
        return null;
      }
    });
    
    if (!isUserNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmPasswordValid) {
      setError("يرجى تصحيح الأخطاء أعلاه");
      return;
    }
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Signup failed");
      setSuccess("Signup successful!");
      setForm({ userName: "", email: "", phone: "", password: "", cPassword: "" });
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };
  return (
    <div className="flex items-center justify-center p-4 md:p-10">
      <div className="sm:mx-auto sm:max-w-md w-full">
        <h3 className="text-2xl font-semibold text-foreground dark:text-foreground">
          Register to workspace
        </h3>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          Take a few moments to register for your company&apos;s workspace
        </p>
        <CSRFProtection onTokenGenerated={(token) => {}}>
          <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-1 gap-y-6">
            <div>
              <Label htmlFor="userName">Username <span className="text-red-500">*</span></Label>
              <InputSanitizer context="html" maxLength={30}>
                <Input type="text" id="userName" name="userName" autoComplete="username" placeholder="Username" className="mt-2" required value={form.userName} onChange={handleChange} />
              </InputSanitizer>
              {errors.userName && (
                <div className="text-red-500 text-sm mt-1">{errors.userName}</div>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <InputSanitizer context="html">
                <Input type="email" id="email" name="email" autoComplete="email" placeholder="Email" className="mt-2" required value={form.email} onChange={handleChange} />
              </InputSanitizer>
              {errors.email && (
                <div className="text-red-500 text-sm mt-1">{errors.email}</div>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
              <InputSanitizer context="phone">
                <Input type="text" id="phone" name="phone" autoComplete="tel" placeholder="Phone" className="mt-2" required value={form.phone} onChange={handleChange} />
              </InputSanitizer>
              {errors.phone && (
                <div className="text-red-500 text-sm mt-1">{errors.phone}</div>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <InputSanitizer context="html" maxLength={128}>
                <Input type="password" id="password" name="password" autoComplete="new-password" placeholder="Password" className="mt-2" required value={form.password} onChange={handleChange} />
              </InputSanitizer>
              {errors.password && (
                <div className="text-red-500 text-sm mt-1">{errors.password}</div>
              )}
            </div>
            <div>
              <Label htmlFor="cPassword">Confirm Password <span className="text-red-500">*</span></Label>
              <InputSanitizer context="html" maxLength={128}>
                <Input type="password" id="cPassword" name="cPassword" autoComplete="new-password" placeholder="Confirm Password" className="mt-2" required value={form.cPassword} onChange={handleChange} />
              </InputSanitizer>
              {errors.cPassword && (
                <div className="text-red-500 text-sm mt-1">{errors.cPassword}</div>
              )}
            </div>
          </div>
          <Separator className="my-6" />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" className="whitespace-nowrap" onClick={() => setForm({ userName: "", email: "", phone: "", password: "", cPassword: "" })}>
              Cancel
            </Button>
            <Button type="submit" className="whitespace-nowrap">
              Submit
            </Button>
          </div>
        </form>
        </CSRFProtection>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-violet-400 hover:underline transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FormLayout01;