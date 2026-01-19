"use client";

import React, { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			error,
			helperText,
			leftIcon,
			rightIcon,
			type = "text",
			className = "",
			...props
		},
		ref
	) => {
		const [showPassword, setShowPassword] = useState(false);
		const isPassword = type === "password";
		const inputType = isPassword && showPassword ? "text" : type;

		return (
			<div className="w-full">
				{label && (
					<label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
						{label}
					</label>
				)}
				<div className="relative">
					{leftIcon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
							{leftIcon}
						</div>
					)}
					<input
						ref={ref}
						type={inputType}
						className={`
              w-full px-4 py-2.5 rounded-lg
              bg-[var(--color-surface)]
              border ${
								error
									? "border-[var(--color-error)]"
									: "border-[var(--color-border)]"
							}
              text-[var(--color-text)]
              placeholder:text-[var(--color-text-muted)]
              transition-all duration-200
              focus:outline-none focus:ring-2 
              ${
								error
									? "focus:ring-[var(--color-error)] focus:border-[var(--color-error)]"
									: "focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
							}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? "pl-10" : ""}
              ${isPassword || rightIcon ? "pr-10" : ""}
              ${className}
            `}
						{...props}
					/>
					{isPassword && (
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					)}
					{rightIcon && !isPassword && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
							{rightIcon}
						</div>
					)}
				</div>
				{error && (
					<p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
				)}
				{helperText && !error && (
					<p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
						{helperText}
					</p>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

export default Input;
