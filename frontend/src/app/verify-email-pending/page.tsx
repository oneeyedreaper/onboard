"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, RefreshCw, LogOut, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { authApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function VerifyEmailPendingPage() {
	const router = useRouter();
	const {
		user,
		isLoading: authLoading,
		isAuthenticated,
		logout,
		refreshProfile,
	} = useAuth();
	const toast = useToast();

	const [isResending, setIsResending] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [isCheckingStatus, setIsCheckingStatus] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.replace("/login");
			return;
		}

		// If already verified, redirect to onboarding
		if (user?.emailVerified) {
			router.replace("/onboarding");
		}
	}, [isAuthenticated, authLoading, user, router]);

	// Countdown timer for resend button
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	// Poll for verification status every 5 seconds
	// Note: We don't include user in deps to avoid restarting interval on every profile change
	useEffect(() => {
		// Only poll if user exists and email is not verified
		if (!user || user.emailVerified) return;

		const interval = setInterval(async () => {
			try {
				await refreshProfile();
			} catch {
				// Ignore errors
			}
		}, 5000);

		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.emailVerified, refreshProfile]);

	const handleResend = async () => {
		setIsResending(true);
		try {
			await authApi.sendVerificationEmail();
			toast.success(
				"Email Sent!",
				"Check your inbox for the verification link."
			);
			setCountdown(60); // 60 second cooldown
		} catch (error: any) {
			toast.error(
				"Error",
				error.message || "Failed to send verification email"
			);
		} finally {
			setIsResending(false);
		}
	};

	const handleCheckStatus = async () => {
		setIsCheckingStatus(true);
		try {
			await refreshProfile();
			if (user?.emailVerified) {
				toast.success("Verified!", "Your email has been verified.");
				router.push("/onboarding");
			} else {
				toast.info(
					"Not Yet",
					"Your email hasn't been verified yet. Check your inbox!"
				);
			}
		} catch {
			toast.error("Error", "Failed to check verification status");
		} finally {
			setIsCheckingStatus(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/login");
		} catch {
			toast.error("Error", "Failed to logout");
		}
	};

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md"
			>
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white text-2xl font-bold mb-4 shadow-lg">
						O
					</div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">
						Verify Your Email
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-2">
						We've sent a verification link to your email
					</p>
				</div>

				<Card>
					<div className="text-center">
						{/* Email Icon */}
						<motion.div
							animate={{ y: [0, -5, 0] }}
							transition={{ duration: 2, repeat: Infinity }}
							className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary-100)] mb-6"
						>
							<Mail className="w-10 h-10 text-[var(--color-primary-600)]" />
						</motion.div>

						{/* Email Address */}
						<p className="text-[var(--color-text)] mb-2">
							We sent a verification email to:
						</p>
						<p className="font-semibold text-[var(--color-primary-600)] mb-6">
							{user?.email}
						</p>

						{/* Instructions */}
						<div className="bg-[var(--color-surface-hover)] rounded-lg p-4 mb-6 text-left">
							<p className="text-sm text-[var(--color-text-secondary)]">
								Click the link in the email to verify your account. If you don't
								see it, check your spam folder.
							</p>
						</div>

						{/* Actions */}
						<div className="space-y-3">
							<Button
								className="w-full"
								onClick={handleCheckStatus}
								isLoading={isCheckingStatus}
								leftIcon={<CheckCircle size={18} />}
							>
								I've Verified My Email
							</Button>

							<Button
								variant="secondary"
								className="w-full"
								onClick={handleResend}
								isLoading={isResending}
								disabled={countdown > 0}
								leftIcon={<RefreshCw size={18} />}
							>
								{countdown > 0
									? `Resend in ${countdown}s`
									: "Resend Verification Email"}
							</Button>

							<Button
								variant="ghost"
								className="w-full"
								onClick={handleLogout}
								leftIcon={<LogOut size={18} />}
							>
								Use Different Email
							</Button>
						</div>
					</div>
				</Card>

				{/* Note */}
				<p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
					The verification link expires in 24 hours
				</p>
			</motion.div>
		</div>
	);
}
