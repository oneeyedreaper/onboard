"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "danger" | "warning" | "default";
	isLoading?: boolean;
}

/**
 * Confirmation dialog for destructive or important actions
 */
export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	isLoading = false,
}: ConfirmDialogProps) {
	const variantStyles = {
		danger: {
			icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
			button: "bg-red-500 hover:bg-red-600 text-white",
		},
		warning: {
			icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
			button: "bg-yellow-500 hover:bg-yellow-600 text-white",
		},
		default: {
			icon: "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]",
			button: "",
		},
	};

	const styles = variantStyles[variant];

	// Handle escape key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isLoading) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, isLoading, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={isLoading ? undefined : onClose}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
					/>

					{/* Dialog */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ type: "spring", duration: 0.3 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
					>
						<div
							className="relative w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-xl border border-[var(--color-border)]"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close button */}
							<button
								onClick={onClose}
								disabled={isLoading}
								className="absolute top-4 right-4 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
							>
								<X size={20} />
							</button>

							<div className="p-6">
								{/* Icon */}
								<div className="flex justify-center mb-4">
									<div
										className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}
									>
										<AlertTriangle size={24} />
									</div>
								</div>

								{/* Content */}
								<div className="text-center mb-6">
									<h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
										{title}
									</h3>
									<p className="text-[var(--color-text-secondary)]">
										{message}
									</p>
								</div>

								{/* Actions */}
								<div className="flex gap-3">
									<Button
										variant="secondary"
										onClick={onClose}
										disabled={isLoading}
										className="flex-1"
									>
										{cancelLabel}
									</Button>
									<Button
										onClick={onConfirm}
										isLoading={isLoading}
										className={`flex-1 ${styles.button}`}
									>
										{confirmLabel}
									</Button>
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

export default ConfirmDialog;
