"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	RefreshCw,
	Home,
	ChevronDown,
	ChevronUp,
	Copy,
	Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
	const [showDetails, setShowDetails] = useState(false);
	const [copied, setCopied] = useState(false);
	const isDev = process.env.NODE_ENV === "development";

	const errorDetails = `Error: ${error.message}
Name: ${error.name}
Stack: ${error.stack}
Digest: ${error.digest || "N/A"}
Time: ${new Date().toISOString()}`;

	const copyError = async () => {
		try {
			await navigator.clipboard.writeText(errorDetails);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API not available
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
			<div className="text-center max-w-lg w-full">
				{/* Icon */}
				<motion.div
					initial={{ scale: 0.5, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.5, type: "spring" }}
					className="mb-6"
				>
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-error-light)]">
						<AlertTriangle className="w-10 h-10 text-[var(--color-error)]" />
					</div>
				</motion.div>

				{/* Message */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					<h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
						Something Went Wrong
					</h1>
					<p className="text-[var(--color-text-secondary)] mb-2">
						We apologize for the inconvenience. An unexpected error has
						occurred.
					</p>
					{error.digest && (
						<p className="text-sm text-[var(--color-text-muted)] mb-4">
							Error ID:{" "}
							<code className="bg-[var(--color-surface-hover)] px-2 py-0.5 rounded">
								{error.digest}
							</code>
						</p>
					)}
				</motion.div>

				{/* Actions */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
				>
					<Button leftIcon={<RefreshCw size={18} />} size="lg" onClick={reset}>
						Try Again
					</Button>
					<Link href="/dashboard">
						<Button variant="secondary" leftIcon={<Home size={18} />} size="lg">
							Go to Dashboard
						</Button>
					</Link>
				</motion.div>

				{/* Developer Details (Dev mode only) */}
				{isDev && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.6 }}
						className="text-left"
					>
						<button
							onClick={() => setShowDetails(!showDetails)}
							className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mx-auto mb-2"
						>
							{showDetails ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
							{showDetails ? "Hide" : "Show"} Technical Details
						</button>

						{showDetails && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mt-2"
							>
								<div className="flex justify-between items-center mb-2">
									<span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
										Development Mode
									</span>
									<button
										onClick={copyError}
										className="flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]"
									>
										{copied ? <Check size={12} /> : <Copy size={12} />}
										{copied ? "Copied!" : "Copy"}
									</button>
								</div>
								<div className="bg-[var(--color-background)] rounded p-3 overflow-x-auto">
									<pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap break-words font-mono">
										<code>
											<strong className="text-[var(--color-error)]">
												{error.name}:
											</strong>{" "}
											{error.message}
											{error.stack && (
												<>
													{"\n\n"}
													<span className="text-[var(--color-text-muted)]">
														{error.stack}
													</span>
												</>
											)}
										</code>
									</pre>
								</div>
							</motion.div>
						)}
					</motion.div>
				)}
			</div>
		</div>
	);
}
