"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [isLoading, setIsLoading] = useState(true);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			setError("Invalid verification link.");
			setIsLoading(false);
			return;
		}

		verifyEmail();
	}, [token]);

	const verifyEmail = async () => {
		if (!token) return;

		try {
			await authApi.verifyEmail(token);
			setIsSuccess(true);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("An unexpected error occurred");
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Card className="max-w-md w-full text-center">
					<Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary-500)] mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-[var(--color-text)]">
						Verifying your email...
					</h3>
					<p className="text-[var(--color-text-secondary)] mt-2">
						Please wait while we verify your email address.
					</p>
				</Card>
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
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white text-2xl font-bold mb-4">
						O
					</div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">
						Email Verification
					</h1>
				</div>

				<Card>
					{isSuccess ? (
						<div className="text-center py-4">
							<div className="w-16 h-16 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
							</div>
							<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
								Email Verified!
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-6">
								Your email has been successfully verified. You can now access
								all features.
							</p>
							<Link href="/dashboard">
								<Button className="w-full">Go to Dashboard</Button>
							</Link>
						</div>
					) : (
						<div className="text-center py-4">
							<div className="w-16 h-16 rounded-full bg-[var(--color-error-light)] flex items-center justify-center mx-auto mb-4">
								<XCircle className="w-8 h-8 text-[var(--color-error)]" />
							</div>
							<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
								Verification Failed
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-6">
								{error || "This verification link is invalid or has expired."}
							</p>
							<div className="space-y-3">
								<Link href="/dashboard">
									<Button className="w-full" variant="secondary">
										Go to Dashboard
									</Button>
								</Link>
								<p className="text-sm text-[var(--color-text-muted)]">
									You can request a new verification email from your profile
									settings.
								</p>
							</div>
						</div>
					)}
				</Card>
			</motion.div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
					<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
