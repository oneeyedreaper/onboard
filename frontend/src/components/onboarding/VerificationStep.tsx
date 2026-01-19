"use client";

import React from "react";
import { ArrowRight, Shield, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface VerificationStepProps {
	onComplete: () => void;
	isSubmitting: boolean;
}

export default function VerificationStep({
	onComplete,
	isSubmitting,
}: VerificationStepProps) {
	return (
		<div>
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-[var(--color-text)]">
					Verification
				</h2>
				<p className="text-[var(--color-text-secondary)] mt-1">
					Your documents are being reviewed
				</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center py-8"
			>
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-600)] mb-6">
					<Shield size={40} />
				</div>

				<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
					Documents Under Review
				</h3>
				<p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
					Our team is reviewing your submitted documents. This usually takes 1-2
					business days. You can continue with the final setup while we verify
					your information.
				</p>

				{/* Status indicators */}
				<div className="mt-8 space-y-3 max-w-sm mx-auto text-left">
					<div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
						<CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
						<span className="text-sm text-[var(--color-text)]">
							Documents received
						</span>
					</div>
					<div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
						<Clock className="w-5 h-5 text-[var(--color-warning)]" />
						<span className="text-sm text-[var(--color-text)]">
							Verification in progress
						</span>
					</div>
					<div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] opacity-50">
						<CheckCircle2 className="w-5 h-5 text-[var(--color-text-muted)]" />
						<span className="text-sm text-[var(--color-text-muted)]">
							Verification complete
						</span>
					</div>
				</div>
			</motion.div>

			<Button
				onClick={onComplete}
				className="w-full mt-6"
				size="lg"
				isLoading={isSubmitting}
				rightIcon={<ArrowRight size={18} />}
			>
				Continue to Final Setup
			</Button>
		</div>
	);
}
