import { HeroGeometric } from "@/components/ui/shape-landing-hero"
import FormLayout01 from "@/components/ui/form-2";
import { Footer } from '@/components/ui/footer-section';

function DemoHeroGeometric() {
    return <HeroGeometric 
        badge="Kokonut UI"
        title1="Elevate Your"
        title2="Digital Vision" 
    />
}

export { DemoHeroGeometric }

// HoverButton demo
import { HoverButton } from "@/components/ui/hover-button"

function HoverButtonDemo() {
  return (
    <div className="min-h-screen grid place-items-center">
      <HoverButton>Get Started</HoverButton>
    </div>
  )
}

export { HoverButtonDemo }

export default function DemoOne() {
	return (
		<div className="relative flex min-h-svh flex-col">
			<div className="min-h-screen flex items-center justify-center">
				<h1 className='font-mono text-2xl font-bold'>Scrool Down!</h1>
			</div>
			<Footer />
		</div>
	);
}