"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";

const signupSchema = z
	.object({
		firstName: z.string().min(1, "First name is required").max(50),
		lastName: z.string().min(1, "Last name is required").max(50),
		email: z.string().email("Please enter a valid email"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Password must contain uppercase, lowercase, and a number"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
	const router = useRouter();
	const { signup } = useAuth();
	const toast = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
	});

	const passwordValue = watch("password", "");

	const onSubmit = async (data: SignupFormData) => {
		setIsLoading(true);
		try {
			await signup(data.email, data.password, data.firstName, data.lastName);
			toast.success(
				"Account created!",
				"Please verify your email to continue."
			);
			router.push("/verify-email-pending");
		} catch (error: any) {
			toast.error("Signup failed", error.message || "Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				{/* Logo/Brand */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white text-2xl font-bold mb-4 shadow-lg">
						O
					</div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">
						Create Account
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-1">
						Start your onboarding journey
					</p>
				</div>

				<Card className="backdrop-blur-sm">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<Input
								{...register("firstName")}
								label="First Name"
								placeholder="John"
								leftIcon={<User size={18} />}
								error={errors.firstName?.message}
								autoComplete="given-name"
							/>
							<Input
								{...register("lastName")}
								label="Last Name"
								placeholder="Doe"
								error={errors.lastName?.message}
								autoComplete="family-name"
							/>
						</div>

						<Input
							{...register("email")}
							label="Email Address"
							type="email"
							placeholder="you@example.com"
							leftIcon={<Mail size={18} />}
							error={errors.email?.message}
							autoComplete="email"
						/>

						<Input
							{...register("password")}
							label="Password"
							type="password"
							placeholder="Create a strong password"
							leftIcon={<Lock size={18} />}
							error={errors.password?.message}
							autoComplete="new-password"
						/>
						<PasswordStrengthMeter password={passwordValue} />

						<Input
							{...register("confirmPassword")}
							label="Confirm Password"
							type="password"
							placeholder="Confirm your password"
							leftIcon={<Lock size={18} />}
							error={errors.confirmPassword?.message}
							autoComplete="new-password"
						/>

						<Button
							type="submit"
							className="w-full"
							size="lg"
							isLoading={isLoading}
							rightIcon={<ArrowRight size={18} />}
						>
							Create Account
						</Button>
					</form>
				</Card>

				<p className="text-center mt-6 text-[var(--color-text-secondary)]">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium transition-colors"
					>
						Sign in
					</Link>
				</p>
			</motion.div>
		</div>
	);
}
