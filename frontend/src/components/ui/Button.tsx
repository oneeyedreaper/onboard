"use client";

import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			variant = "primary",
			size = "md",
			isLoading = false,
			leftIcon,
			rightIcon,
			className = "",
			disabled,
			...props
		},
		ref
	) => {
		const baseStyles = `
      inline-flex items-center justify-center font-medium transition-all
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

		const variants = {
			primary: `
        bg-[var(--color-primary-500)] text-white
        hover:bg-[var(--color-primary-600)]
        focus-visible:ring-[var(--color-primary-500)]
        shadow-sm hover:shadow-md
      `,
			secondary: `
        bg-[var(--color-surface)] text-[var(--color-text)]
        border border-[var(--color-border)]
        hover:bg-[var(--color-surface-hover)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
			outline: `
        bg-transparent text-[var(--color-primary-500)]
        border-2 border-[var(--color-primary-500)]
        hover:bg-[var(--color-primary-50)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
			ghost: `
        bg-transparent text-[var(--color-text)]
        hover:bg-[var(--color-surface-hover)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
			danger: `
        bg-[var(--color-error)] text-white
        hover:opacity-90
        focus-visible:ring-[var(--color-error)]
      `,
		};

		const sizes = {
			sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
			md: "px-4 py-2 text-sm rounded-lg gap-2",
			lg: "px-6 py-3 text-base rounded-lg gap-2",
		};

		return (
			<motion.button
				ref={ref as React.Ref<HTMLButtonElement>}
				whileTap={{ scale: 0.98 }}
				className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
				disabled={disabled || isLoading}
				{...(props as any)}
			>
				{isLoading ? (
					<svg
						className="animate-spin h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				) : (
					leftIcon
				)}
				{children}
				{!isLoading && rightIcon}
			</motion.button>
		);
	}
);

Button.displayName = "Button";

export default Button;
