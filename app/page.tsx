import { HeroStatic } from '@/components/ui/hero-static';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Enable ISR with 1 hour revalidation for faster subsequent loads
export const revalidate = 3600;

// Metadata for better SEO and performance
export const metadata = {
  title: 'Wivz - من هنا تبدأ متعتك',
  description: 'موقعنا بيقدملك شحن سريع وآمن، طرق دفع سهلة زي التحويل للمحفظة، تنوع كبير في الشحن والاشتراكات يغطي كل احتياجاتك',
};

export default function Home() {
  return (
    <main className="relative">
      <ThemeToggle />
      <HeroStatic 
        badge="Wivz"
        title1="من هنا تبدأ متعتك"
        title2="أمان مضمون… سرعة جنون… شحن واشتراكات موجود"
      />
    </main>
  );
}