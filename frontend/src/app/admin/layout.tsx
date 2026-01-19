"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { user, isLoading, isAuthenticated } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (!isAuthenticated) {
				router.replace("/login");
			} else if (user?.role !== "ADMIN") {
				router.replace("/dashboard");
			}
		}
	}, [isLoading, isAuthenticated, user, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	if (!isAuthenticated || user?.role !== "ADMIN") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	return <>{children}</>;
}
