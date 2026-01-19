"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await authApi.forgotPassword(email);
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
						Forgot Password
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-2">
						{isSuccess
							? "Check your email for reset instructions"
							: "Enter your email to receive a reset link"}
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
								Email Sent!
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-6">
								If an account with <strong>{email}</strong> exists, you'll
								receive a password reset link shortly.
							</p>
							<Link href="/login">
								<Button className="w-full" leftIcon={<ArrowLeft size={16} />}>
									Back to Login
								</Button>
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
								type="email"
								label="Email Address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								leftIcon={<Mail size={18} />}
								required
							/>

							<Button type="submit" className="w-full" isLoading={isLoading}>
								Send Reset Link
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
