"use client";

import React from "react";
import { motion } from "framer-motion";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	hover?: boolean;
	padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
	children,
	className = "",
	hover = false,
	padding = "md",
}: CardProps) {
	const paddingStyles = {
		none: "",
		sm: "p-4",
		md: "p-6",
		lg: "p-8",
	};

	return (
		<motion.div
			whileHover={hover ? { y: -2, boxShadow: "var(--shadow-lg)" } : undefined}
			className={`
        bg-[var(--color-surface)]
        border border-[var(--color-border)]
        rounded-xl
        shadow-sm
        transition-shadow
        ${paddingStyles[padding]}
        ${className}
      `}
		>
			{children}
		</motion.div>
	);
}

export function CardHeader({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h3
			className={`text-lg font-semibold text-[var(--color-text)] ${className}`}
		>
			{children}
		</h3>
	);
}

export function CardDescription({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p
			className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`}
		>
			{children}
		</p>
	);
}

export function CardContent({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function CardFooter({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`mt-4 pt-4 border-t border-[var(--color-border-light)] ${className}`}
		>
			{children}
		</div>
	);
}
