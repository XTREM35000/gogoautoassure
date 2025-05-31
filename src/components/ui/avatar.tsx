import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-xl'
};

const AvatarContext = React.createContext<{ size: 'sm' | 'md' | 'lg' }>({ size: 'md' });

export function Avatar({
  size = 'md',
  className,
  children,
  ...props
}: AvatarProps) {
  return (
    <AvatarContext.Provider value={{ size }}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gray-100 overflow-hidden',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
}

export function AvatarImage({
  src,
  alt = '',
  onLoadingStatusChange,
  className,
  ...props
}: AvatarImageProps) {
  const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');

  React.useEffect(() => {
    onLoadingStatusChange?.(status);
  }, [status, onLoadingStatusChange]);

  return (
    <img
      src={src}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('error')}
      {...props}
    />
  );
}

export function AvatarFallback({
  children,
  className,
  ...props
}: AvatarFallbackProps) {
  const { size } = React.useContext(AvatarContext);

  return (
    <div
      className={cn(
        'flex items-center justify-center w-full h-full font-medium text-gray-600 bg-gray-200',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Avatar.Image = AvatarImage;
Avatar.Fallback = AvatarFallback;
