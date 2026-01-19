"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!token) {
			setError("Invalid reset link. Please request a new password reset.");
		}
	}, [token]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!password) {
			newErrors.password = "Password is required";
		} else if (password.length < 8) {
			newErrors.password = "Password must be at least 8 characters";
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
			newErrors.password =
				"Password must contain uppercase, lowercase, and number";
		}

		if (password !== confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!validateForm() || !token) return;

		setIsLoading(true);

		try {
			await authApi.resetPassword(token, password);
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

	if (!token && !isSuccess) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
				<Card className="max-w-md w-full text-center">
					<div className="w-16 h-16 rounded-full bg-[var(--color-error-light)] flex items-center justify-center mx-auto mb-4">
						<XCircle className="w-8 h-8 text-[var(--color-error)]" />
					</div>
					<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
						Invalid Reset Link
					</h3>
					<p className="text-[var(--color-text-secondary)] mb-6">
						This password reset link is invalid or has expired.
					</p>
					<Link href="/forgot-password">
						<Button className="w-full">Request New Reset Link</Button>
					</Link>
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
						Reset Password
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-2">
						{isSuccess
							? "Your password has been reset"
							: "Create a new password"}
					</p>
				</div>

				<Card>
					{isSuccess ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-4"
						>
							<div className="w-16 h-16 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
							</div>
							<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
								Password Reset!
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-6">
								Your password has been successfully reset. You can now log in
								with your new password.
							</p>
							<Link href="/login">
								<Button className="w-full">Go to Login</Button>
							</Link>
						</motion.div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="p-3 rounded-lg bg-[var(--color-error-light)] text-[var(--color-error)] text-sm">
									{error}
								</div>
							)}

							<Input
								type="password"
								label="New Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter new password"
								leftIcon={<Lock size={18} />}
								error={errors.password}
								helperText="At least 8 characters with uppercase, lowercase, and number"
							/>

							<Input
								type="password"
								label="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm new password"
								leftIcon={<Lock size={18} />}
								error={errors.confirmPassword}
							/>

							<Button
								type="submit"
								className="w-full"
								isLoading={isLoading}
								disabled={!password || !confirmPassword}
							>
								Reset Password
							</Button>

							<div className="text-center">
								<Link
									href="/login"
									className="text-sm text-[var(--color-primary-500)] hover:underline inline-flex items-center gap-1"
								>
									<ArrowLeft size={14} />
									Back to Login
								</Link>
							</div>
						</form>
					)}
				</Card>
			</motion.div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
					<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	);
}
