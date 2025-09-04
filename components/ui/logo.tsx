'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const sizeMap = {
  sm: { width: 48, height: 48, className: 'w-12 h-12' },
  md: { width: 64, height: 64, className: 'w-16 h-16' },
  lg: { width: 96, height: 96, className: 'w-24 h-24' },
  xl: { width: 128, height: 128, className: 'w-32 h-32' },
  xxl: { width: 192, height: 192, className: 'w-48 h-48' }
};

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl'
};

export const Logo: React.FC<LogoProps> = ({
  size = 'xxl',
  showText = true,
  textSize = 'md',
  className,
  onClick,
  clickable = true
}) => {
  const router = useRouter();
  const sizeConfig = sizeMap[size];
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable) {
      router.push('/');
    }
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-1',
        clickable && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-0">
        <Image
          src="/images/my-logo.png"
          alt="Zen Store Logo 2"
          width={sizeConfig.width / 2}
          height={sizeConfig.height}
          className={cn('object-contain')}
          priority
        />
        <Image
          src="/images/logo-4-v1.png"
          alt="Zen Store Logo 1"
          width={sizeConfig.width / 2}
          height={sizeConfig.height}
          className={cn('object-contain')}
          priority
        />
      </div>
      {showText && (
        <span className={cn(
          'font-bold tracking-wide text-white',
          textSizeMap[textSize]
        )}>
          Zen Store
        </span>
      )}
    </div>
  );
};

export default Logo;