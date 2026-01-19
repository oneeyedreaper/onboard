"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function HomePage() {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				// Check onboarding status
				if (user?.onboardingProgress?.status === "COMPLETED") {
					router.replace("/dashboard");
				} else {
					router.replace("/onboarding");
				}
			} else {
				router.replace("/login");
			}
		}
	}, [isAuthenticated, isLoading, user, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
			<div className="text-center">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)] mx-auto" />
				<p className="mt-4 text-[var(--color-text-secondary)]">Loading...</p>
			</div>
		</div>
	);
}
