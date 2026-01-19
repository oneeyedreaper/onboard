"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
}

interface ToastContextType {
	toast: (type: ToastType, title: string, message?: string) => void;
	success: (title: string, message?: string) => void;
	error: (title: string, message?: string) => void;
	warning: (title: string, message?: string) => void;
	info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addToast = useCallback(
		(type: ToastType, title: string, message?: string) => {
			const id = Math.random().toString(36).substring(7);
			setToasts((prev) => [...prev, { id, type, title, message }]);

			// Auto remove after 5 seconds
			setTimeout(() => removeToast(id), 5000);
		},
		[removeToast]
	);

	const value: ToastContextType = {
		toast: addToast,
		success: (title, message) => addToast("success", title, message),
		error: (title, message) => addToast("error", title, message),
		warning: (title, message) => addToast("warning", title, message),
		info: (title, message) => addToast("info", title, message),
	};

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

function ToastContainer({
	toasts,
	onRemove,
}: {
	toasts: Toast[];
	onRemove: (id: string) => void;
}) {
	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			<AnimatePresence>
				{toasts.map((toast) => (
					<ToastItem
						key={toast.id}
						toast={toast}
						onRemove={() => onRemove(toast.id)}
					/>
				))}
			</AnimatePresence>
		</div>
	);
}

function ToastItem({
	toast,
	onRemove,
}: {
	toast: Toast;
	onRemove: () => void;
}) {
	const icons = {
		success: <CheckCircle className="w-5 h-5" />,
		error: <AlertCircle className="w-5 h-5" />,
		warning: <AlertTriangle className="w-5 h-5" />,
		info: <Info className="w-5 h-5" />,
	};

	const colors = {
		success:
			"bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]",
		error:
			"bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)]",
		warning:
			"bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]",
		info: "bg-[var(--color-primary-100)] text-[var(--color-primary-600)] border-[var(--color-primary-500)]",
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.95 }}
			className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
        bg-[var(--color-surface)] min-w-[300px] max-w-[400px]
        ${colors[toast.type]}
      `}
		>
			<div className="flex-shrink-0">{icons[toast.type]}</div>
			<div className="flex-1 min-w-0">
				<p className="font-medium text-[var(--color-text)]">{toast.title}</p>
				{toast.message && (
					<p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
						{toast.message}
					</p>
				)}
			</div>
			<button
				onClick={onRemove}
				className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<X className="w-4 h-4" />
			</button>
		</motion.div>
	);
}
