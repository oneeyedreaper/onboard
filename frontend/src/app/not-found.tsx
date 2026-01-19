"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
			<div className="text-center max-w-md">
				{/* Animated 404 */}
				<motion.div
					initial={{ scale: 0.5, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.5, type: "spring" }}
					className="mb-8"
				>
					<div className="relative inline-block">
						<span className="text-[150px] font-bold bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] bg-clip-text text-transparent leading-none">
							404
						</span>
						<motion.div
							animate={{ rotate: [0, 10, -10, 0] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
							className="absolute -top-4 -right-4"
						>
							<Search className="w-12 h-12 text-[var(--color-primary-400)]" />
						</motion.div>
					</div>
				</motion.div>

				{/* Message */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					<h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
						Page Not Found
					</h1>
					<p className="text-[var(--color-text-secondary)] mb-8">
						Oops! The page you're looking for doesn't exist or has been moved.
						Let's get you back on track.
					</p>
				</motion.div>

				{/* Actions */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="flex flex-col sm:flex-row gap-3 justify-center"
				>
					<Link href="/dashboard">
						<Button leftIcon={<Home size={18} />} size="lg">
							Go to Dashboard
						</Button>
					</Link>
					<Button
						variant="secondary"
						leftIcon={<ArrowLeft size={18} />}
						size="lg"
						onClick={() => window.history.back()}
					>
						Go Back
					</Button>
				</motion.div>

				{/* Decorative elements */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
					<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--color-primary-500)] opacity-5 rounded-full blur-3xl" />
					<div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--color-primary-400)] opacity-5 rounded-full blur-3xl" />
				</div>
			</div>
		</div>
	);
}
