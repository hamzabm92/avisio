import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'text-white font-semibold shadow-sm hover:opacity-90 active:opacity-80',
  secondary: 'font-medium border hover:bg-[#F5EDD8] active:bg-[#EDE8E3]',
  ghost: 'font-medium hover:bg-[#F5EDD8] active:bg-[#EDE8E3]',
  danger: 'text-white font-semibold shadow-sm hover:opacity-90 active:opacity-80',
};

const VARIANT_INLINE: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: '#C9A96E', color: 'white' },
  secondary: { backgroundColor: 'transparent', color: '#2C2420', borderColor: '#EDE8E3' },
  ghost: { backgroundColor: 'transparent', color: '#2C2420' },
  danger: { backgroundColor: '#C97A7A', color: 'white' },
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 transition-all
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={VARIANT_INLINE[variant]}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
