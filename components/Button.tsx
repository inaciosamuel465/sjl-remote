import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'round';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ onClick, className = '', children, variant = 'secondary', disabled }) => {
  
  const handlePress = () => {
    if (disabled) return;
    // Trigger haptic feedback if available in browser/webview
    if (navigator.vibrate) {
      navigator.vibrate(15); 
    }
    onClick?.();
  };

  const baseStyles = "flex items-center justify-center font-medium transition-all active:scale-95 select-none touch-manipulation";
  
  const variants = {
    primary: "bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 active:bg-blue-700",
    secondary: "bg-zinc-800 text-zinc-200 rounded-xl shadow-md shadow-black/40 active:bg-zinc-700 border border-zinc-700",
    danger: "bg-red-500/10 text-red-500 rounded-xl active:bg-red-500/20 border border-red-500/20",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-200 active:bg-zinc-800/50 rounded-lg",
    round: "bg-zinc-800 text-zinc-200 rounded-full w-12 h-12 shadow-md shadow-black/40 active:bg-zinc-700 border border-zinc-700"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handlePress}
      disabled={disabled}
    >
      {children}
    </button>
  );
};