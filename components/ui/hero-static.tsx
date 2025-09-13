import Link from "next/link";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Lightweight server-side hero component for fast LCP
export function HeroStatic({
  badge = "Design Collective",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
}: {
  badge?: string;
  title1?: string;
  title2?: string;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      {/* Static background gradients - no animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
      
      {/* Static decorative shapes - no framer-motion */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] md:left-[-5%] top-[15%] md:top-[20%] w-[600px] h-[140px] transform rotate-12">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/[0.15] to-transparent backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]" />
        </div>
        
        <div className="absolute right-[-5%] md:right-[0%] top-[70%] md:top-[75%] w-[500px] h-[120px] transform -rotate-15">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/[0.15] to-transparent backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]" />
        </div>
        
        <div className="absolute left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%] w-[300px] h-[80px] transform -rotate-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/[0.15] to-transparent backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]" />
        </div>
        
        <div className="absolute right-[15%] md:right-[20%] top-[10%] md:top-[15%] w-[200px] h-[60px] transform rotate-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/[0.15] to-transparent backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]" />
        </div>
        
        <div className="absolute left-[20%] md:left-[25%] top-[5%] md:top-[10%] w-[150px] h-[40px] transform -rotate-25">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/[0.15] to-transparent backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Static badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12">
            <Circle className="h-2 w-2 fill-rose-500/80" />
            <span className="text-sm text-white/60 tracking-wide">
              {badge}
            </span>
          </div>

          {/* Static titles */}
          <h1 className="text-4xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-6xl font-bold mb-6 md:mb-8 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              {title1}
            </span>
            <br />
            <span className={cn(
              "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300"
            )}>
              {title2}
            </span>
          </h1>

          {/* Static description */}
          <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
            🎮 موقعنا بيقدملك شحن سريع وآمن، طرق دفع سهلة زي التحويل للمحفظة، تنوع كبير في الشحن والاشتراكات يغطي كل احتياجاتك، ومع دعم عملاء 24 ساعه تلاقي المساعدة في أي وقت.
          </p>

          {/* Static buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signin" prefetch={true} className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-lg transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/category" prefetch={true} className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500/20 to-rose-500/20 border border-white/10 text-white font-medium text-lg hover:from-indigo-500/30 hover:to-rose-500/30 transition-colors">
              الفئات
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}