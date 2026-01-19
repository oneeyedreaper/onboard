"use client";

import React from "react";

interface SkeletonProps {
	className?: string;
	variant?: "text" | "circular" | "rectangular";
	width?: string | number;
	height?: string | number;
	animation?: "pulse" | "wave" | "none";
}

export default function Skeleton({
	className = "",
	variant = "text",
	width,
	height,
	animation = "pulse",
}: SkeletonProps) {
	const baseStyles = "bg-[var(--color-border)]";

	const variantStyles = {
		text: "rounded",
		circular: "rounded-full",
		rectangular: "rounded-lg",
	};

	const animationStyles = {
		pulse: "animate-pulse",
		wave: "animate-shimmer",
		none: "",
	};

	const style: React.CSSProperties = {
		width: width || (variant === "text" ? "100%" : undefined),
		height:
			height ||
			(variant === "text" ? "1em" : variant === "circular" ? width : undefined),
	};

	return (
		<div
			className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
			style={style}
		/>
	);
}

// Preset skeleton components
export function SkeletonText({
	lines = 3,
	className = "",
}: {
	lines?: number;
	className?: string;
}) {
	return (
		<div className={`space-y-2 ${className}`}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton
					key={i}
					variant="text"
					height={16}
					width={i === lines - 1 ? "75%" : "100%"}
				/>
			))}
		</div>
	);
}

export function SkeletonAvatar({
	size = 40,
	className = "",
}: {
	size?: number;
	className?: string;
}) {
	return (
		<Skeleton
			variant="circular"
			width={size}
			height={size}
			className={className}
		/>
	);
}

export function SkeletonCard({ className = "" }: { className?: string }) {
	return (
		<div
			className={`p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
		>
			<div className="flex items-center gap-4 mb-4">
				<SkeletonAvatar size={48} />
				<div className="flex-1">
					<Skeleton height={20} width="60%" className="mb-2" />
					<Skeleton height={14} width="40%" />
				</div>
			</div>
			<SkeletonText lines={2} />
		</div>
	);
}

export function SkeletonButton({
	width = 100,
	height = 40,
	className = "",
}: {
	width?: number;
	height?: number;
	className?: string;
}) {
	return (
		<Skeleton
			variant="rectangular"
			width={width}
			height={height}
			className={className}
		/>
	);
}
