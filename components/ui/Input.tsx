import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, suffix, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            className={`w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan focus:ring-1 focus:ring-blox-cyan/30 transition-all duration-300 ${
              error ? 'border-blox-red/60 focus:ring-blox-red/30' : ''
            } ${suffix ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {suffix}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-blox-red font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
