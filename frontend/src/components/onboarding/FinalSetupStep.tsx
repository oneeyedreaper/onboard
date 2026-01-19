"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Bell, Mail, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const finalSetupSchema = z.object({
	preferences: z.object({
		notifications: z.boolean(),
		newsletter: z.boolean(),
	}),
	termsAccepted: z.boolean().refine((val) => val === true, {
		message: "You must accept the terms and conditions",
	}),
});

type FinalSetupData = z.infer<typeof finalSetupSchema>;

interface FinalSetupStepProps {
	onComplete: (data: FinalSetupData) => void;
	isSubmitting: boolean;
}

export default function FinalSetupStep({
	onComplete,
	isSubmitting,
}: FinalSetupStepProps) {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FinalSetupData>({
		resolver: zodResolver(finalSetupSchema),
		defaultValues: {
			preferences: {
				notifications: true,
				newsletter: false,
			},
			termsAccepted: false,
		},
	});

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-[var(--color-text)]">
					Final Setup
				</h2>
				<p className="text-[var(--color-text-secondary)] mt-1">
					Configure your preferences and complete onboarding
				</p>
			</div>

			<form onSubmit={handleSubmit(onComplete)} className="space-y-6">
				{/* Preferences */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-[var(--color-text)]">
						Notification Preferences
					</h3>

					<Controller
						name="preferences.notifications"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
								<input
									type="checkbox"
									checked={field.value}
									onChange={field.onChange}
									className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
								/>
								<div className="flex items-center gap-3 flex-1">
									<Bell className="w-5 h-5 text-[var(--color-text-muted)]" />
									<div>
										<p className="font-medium text-[var(--color-text)]">
											Push Notifications
										</p>
										<p className="text-sm text-[var(--color-text-muted)]">
											Receive updates about your account
										</p>
									</div>
								</div>
							</label>
						)}
					/>

					<Controller
						name="preferences.newsletter"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
								<input
									type="checkbox"
									checked={field.value}
									onChange={field.onChange}
									className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
								/>
								<div className="flex items-center gap-3 flex-1">
									<Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
									<div>
										<p className="font-medium text-[var(--color-text)]">
											Newsletter
										</p>
										<p className="text-sm text-[var(--color-text-muted)]">
											Weekly tips and updates
										</p>
									</div>
								</div>
							</label>
						)}
					/>
				</div>

				{/* Terms */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-[var(--color-text)]">
						Terms & Conditions
					</h3>

					<Controller
						name="termsAccepted"
						control={control}
						render={({ field }) => (
							<div>
								<label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
									<input
										type="checkbox"
										checked={field.value}
										onChange={field.onChange}
										className="w-5 h-5 mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
									/>
									<div>
										<p className="font-medium text-[var(--color-text)]">
											I accept the Terms of Service and Privacy Policy
										</p>
										<p className="text-sm text-[var(--color-text-muted)]">
											By continuing, you agree to our terms and acknowledge you
											have read our privacy policy.
										</p>
									</div>
								</label>
								{errors.termsAccepted && (
									<p className="text-sm text-[var(--color-error)] mt-2">
										{errors.termsAccepted.message}
									</p>
								)}
							</div>
						)}
					/>
				</div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="p-4 rounded-lg bg-[var(--color-success-light)] border border-[var(--color-success)]"
				>
					<div className="flex items-center gap-3">
						<CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
						<p className="text-sm text-[var(--color-success)] font-medium">
							You're almost done! Complete this step to finish onboarding.
						</p>
					</div>
				</motion.div>

				<Button
					type="submit"
					className="w-full"
					size="lg"
					isLoading={isSubmitting}
				>
					Complete Onboarding 🎉
				</Button>
			</form>
		</div>
	);
}
