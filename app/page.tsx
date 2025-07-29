import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
  return (
    <main className="relative">
      <ThemeToggle />
      <HeroGeometric 
        badge="مرحباً بك في المشروع"
        title1="ارتقِ بتجربتك"
        title2="الرقمية معنا"
      />
    </main>
  );
}