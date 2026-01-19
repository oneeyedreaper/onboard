"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();
	const toast = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			await login(data.email, data.password);
			toast.success("Welcome back!", "You have been logged in successfully.");
			router.push("/");
		} catch (error: any) {
			toast.error(
				"Login failed",
				error.message || "Please check your credentials."
			);
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
						Welcome Back
					</h1>
					<p className="text-[var(--color-text-secondary)] mt-1">
						Sign in to continue your onboarding
					</p>
				</div>

				<Card className="backdrop-blur-sm">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
							placeholder="Enter your password"
							leftIcon={<Lock size={18} />}
							error={errors.password?.message}
							autoComplete="current-password"
						/>

						<div className="flex justify-end">
							<Link
								href="/forgot-password"
								className="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
							>
								Forgot password?
							</Link>
						</div>

						<Button
							type="submit"
							className="w-full"
							size="lg"
							isLoading={isLoading}
							rightIcon={<ArrowRight size={18} />}
						>
							Sign In
						</Button>
					</form>
				</Card>

				<p className="text-center mt-6 text-[var(--color-text-secondary)]">
					Don&apos;t have an account?{" "}
					<Link
						href="/signup"
						className="text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium transition-colors"
					>
						Sign up
					</Link>
				</p>
			</motion.div>
		</div>
	);
}
