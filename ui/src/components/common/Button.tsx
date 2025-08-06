import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  isLoading = false,
  children,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  };

  return (
    <button className={clsx(baseClasses, variantClasses[variant])} disabled={isLoading} {...props}>
      {isLoading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
      {children}
    </button>
  );
};
