import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blox-cyan/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-blox-red hover:bg-red-600 text-white border border-red-500/20' + (glow ? ' btn-glow-red' : ''),
      secondary: 'bg-blox-cyan hover:bg-[#00B5DB] text-blox-dark border border-blox-cyan/20' + (glow ? ' btn-glow-cyan' : ''),
      glass: 'glass-panel text-white hover:bg-white/10 hover:border-white/20',
      premium: 'glass-panel-premium text-white hover:border-blox-purple/50 shadow-lg',
      ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
