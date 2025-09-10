import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
  return (
    <main className="relative">
      <ThemeToggle />
      <HeroGeometric 
        badge="Wivz"
        title1="من هنا تبدأ متعتك"
        title2="أمان مضمون… سرعة جنون… شحن واشتراكات موجود"
      />
    </main>
  );
}