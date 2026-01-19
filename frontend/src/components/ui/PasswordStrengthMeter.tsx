"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
	password: string;
	className?: string;
	showRequirements?: boolean;
}

interface PasswordStrength {
	score: number; // 0-4
	label: string;
	color: string;
	bgColor: string;
}

interface PasswordRequirement {
	label: string;
	met: boolean;
}

/**
 * Analyzes password and returns strength score and details
 */
function analyzePassword(password: string): {
	strength: PasswordStrength;
	requirements: PasswordRequirement[];
} {
	const requirements: PasswordRequirement[] = [
		{ label: "At least 8 characters", met: password.length >= 8 },
		{ label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
		{ label: "Contains lowercase letter", met: /[a-z]/.test(password) },
		{ label: "Contains number", met: /[0-9]/.test(password) },
		{ label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
	];

	const metCount = requirements.filter((r) => r.met).length;

	const strengthLevels: PasswordStrength[] = [
		{
			score: 0,
			label: "Very Weak",
			color: "text-red-500",
			bgColor: "bg-red-500",
		},
		{
			score: 1,
			label: "Weak",
			color: "text-orange-500",
			bgColor: "bg-orange-500",
		},
		{
			score: 2,
			label: "Fair",
			color: "text-yellow-500",
			bgColor: "bg-yellow-500",
		},
		{ score: 3, label: "Good", color: "text-lime-500", bgColor: "bg-lime-500" },
		{
			score: 4,
			label: "Strong",
			color: "text-green-500",
			bgColor: "bg-green-500",
		},
	];

	// Score based on requirements met
	let score = 0;
	if (password.length === 0) {
		score = 0;
	} else if (metCount <= 1) {
		score = 0;
	} else if (metCount === 2) {
		score = 1;
	} else if (metCount === 3) {
		score = 2;
	} else if (metCount === 4) {
		score = 3;
	} else {
		score = 4;
	}

	return {
		strength: strengthLevels[score],
		requirements,
	};
}

/**
 * Visual password strength meter with requirements checklist
 */
export function PasswordStrengthMeter({
	password,
	className = "",
	showRequirements = true,
}: PasswordStrengthMeterProps) {
	const { strength, requirements } = useMemo(
		() => analyzePassword(password),
		[password]
	);

	if (!password) return null;

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Strength bar */}
			<div className="space-y-1">
				<div className="flex justify-between items-center text-xs">
					<span className="text-[var(--color-text-muted)]">
						Password strength
					</span>
					<span className={`font-medium ${strength.color}`}>
						{strength.label}
					</span>
				</div>
				<div className="h-1.5 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${((strength.score + 1) / 5) * 100}%` }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className={`h-full rounded-full ${strength.bgColor}`}
					/>
				</div>
			</div>

			{/* Requirements checklist */}
			{showRequirements && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="overflow-hidden"
				>
					<ul className="space-y-1">
						{requirements.map((req, index) => (
							<motion.li
								key={req.label}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className={`flex items-center gap-2 text-xs ${
									req.met ? "text-green-500" : "text-[var(--color-text-muted)]"
								}`}
							>
								{req.met ? (
									<Check size={12} className="flex-shrink-0" />
								) : (
									<X size={12} className="flex-shrink-0" />
								)}
								<span>{req.label}</span>
							</motion.li>
						))}
					</ul>
				</motion.div>
			)}
		</div>
	);
}

export default PasswordStrengthMeter;
