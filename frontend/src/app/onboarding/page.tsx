"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { onboardingApi, OnboardingStatus } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PersonalInfoStep from "@/components/onboarding/PersonalInfoStep";
import DocumentsStep from "@/components/onboarding/DocumentsStep";
import VerificationStep from "@/components/onboarding/VerificationStep";
import FinalSetupStep from "@/components/onboarding/FinalSetupStep";

export default function OnboardingPage() {
	const router = useRouter();
	const {
		user,
		isLoading: authLoading,
		isAuthenticated,
		refreshProfile,
	} = useAuth();
	const toast = useToast();

	const [status, setStatus] = useState<OnboardingStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);

	// Fetch onboarding status
	useEffect(() => {
		const fetchStatus = async () => {
			if (!isAuthenticated) return;
			try {
				const data = await onboardingApi.getStatus();
				setStatus(data);
				setCurrentStep(data.currentStep);

				// Redirect if completed
				if (data.status === "COMPLETED") {
					router.replace("/dashboard");
				}
			} catch (error) {
				toast.error("Error", "Failed to load onboarding status");
			} finally {
				setIsLoading(false);
			}
		};

		if (!authLoading) {
			if (!isAuthenticated) {
				router.replace("/login");
			} else if (user && !user.emailVerified) {
				// Require email verification before onboarding
				router.replace("/verify-email-pending");
			} else {
				fetchStatus();
			}
		}
	}, [isAuthenticated, authLoading, user, router, toast]);

	const handleStepComplete = async (
		stepNumber: number,
		data?: Record<string, unknown>
	) => {
		setIsSubmitting(true);
		try {
			const result = await onboardingApi.completeStep(stepNumber, data);

			// Refresh status
			const newStatus = await onboardingApi.getStatus();
			setStatus(newStatus);

			if (result.status === "COMPLETED") {
				toast.success("Congratulations!", "You have completed onboarding.");
				await refreshProfile();
				router.push("/dashboard");
			} else {
				setCurrentStep(result.currentStep);
				toast.success(
					"Step completed!",
					`Moving to step ${result.currentStep}`
				);
			}
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to complete step");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	const steps = status?.steps || [];
	const totalSteps = steps.length;

	return (
		<div className="min-h-screen bg-[var(--color-background)] py-8 px-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[var(--color-text)]">
						Complete Your Onboarding
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-2">
						Just a few steps to get you started
					</p>
				</div>

				{/* Progress Stepper */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => {
							const stepNumber = index + 1;
							const isCompleted = step.status === "COMPLETED";
							const isCurrent = stepNumber === currentStep;

							return (
								<React.Fragment key={step.id}>
									<div className="flex flex-col items-center">
										<motion.div
											initial={false}
											animate={{
												backgroundColor: isCompleted
													? "var(--color-success)"
													: isCurrent
													? "var(--color-primary-500)"
													: "var(--color-surface)",
												borderColor:
													isCompleted || isCurrent
														? "transparent"
														: "var(--color-border)",
											}}
											className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        border-2 transition-colors
                        ${
													isCompleted || isCurrent
														? "text-white"
														: "text-[var(--color-text-muted)]"
												}
                      `}
										>
											{isCompleted ? (
												<Check size={20} />
											) : (
												<span className="font-semibold">{stepNumber}</span>
											)}
										</motion.div>
										<span
											className={`
                      text-xs mt-2 font-medium hidden sm:block
                      ${
												isCurrent
													? "text-[var(--color-primary-500)]"
													: "text-[var(--color-text-muted)]"
											}
                    `}
										>
											{step.title}
										</span>
									</div>

									{stepNumber < totalSteps && (
										<div
											className={`
                        flex-1 h-1 mx-2 rounded-full transition-colors
                        ${
													steps[index].status === "COMPLETED"
														? "bg-[var(--color-success)]"
														: "bg-[var(--color-border)]"
												}
                      `}
										/>
									)}
								</React.Fragment>
							);
						})}
					</div>
				</div>

				{/* Step Content */}
				<Card padding="lg">
					<AnimatePresence mode="wait">
						<motion.div
							key={currentStep}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							{currentStep === 1 && (
								<PersonalInfoStep
									initialData={user}
									onComplete={(data) => handleStepComplete(1, data)}
									isSubmitting={isSubmitting}
								/>
							)}
							{currentStep === 2 && (
								<DocumentsStep
									onComplete={() => handleStepComplete(2)}
									isSubmitting={isSubmitting}
								/>
							)}
							{currentStep === 3 && (
								<VerificationStep
									onComplete={() => handleStepComplete(3)}
									isSubmitting={isSubmitting}
								/>
							)}
							{currentStep === 4 && (
								<FinalSetupStep
									onComplete={(data) => handleStepComplete(4, data)}
									isSubmitting={isSubmitting}
								/>
							)}
						</motion.div>
					</AnimatePresence>

					{/* Navigation Buttons */}
					<div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border-light)]">
						<Button
							variant="ghost"
							onClick={handleBack}
							disabled={currentStep === 1 || isSubmitting}
							leftIcon={<ArrowLeft size={18} />}
						>
							Back
						</Button>
						<div className="text-sm text-[var(--color-text-muted)]">
							Step {currentStep} of {totalSteps}
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
