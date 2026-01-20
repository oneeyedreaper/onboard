"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	LayoutDashboard,
	User,
	FileText,
	Settings,
	LogOut,
	Menu,
	X,
	Sun,
	Moon,
	CheckCircle,
	Clock,
	Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import {
	onboardingApi,
	documentsApi,
	OnboardingStatus,
	Document,
} from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card, { CardTitle, CardDescription } from "@/components/ui/Card";

export default function DashboardPage() {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
	const { theme, setTheme, resolvedTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [status, setStatus] = useState<OnboardingStatus | null>(null);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!isAuthenticated) return;
			try {
				const [statusData, docsData] = await Promise.all([
					onboardingApi.getStatus(),
					documentsApi.getAll(),
				]);
				setStatus(statusData);
				setDocuments(docsData);
			} catch (error) {
				console.error("Failed to load dashboard data");
			} finally {
				setIsLoading(false);
			}
		};

		if (!authLoading) {
			if (!isAuthenticated) {
				router.replace("/login");
			} else if (user && !user.emailVerified) {
				// Require email verification
				router.replace("/verify-email-pending");
			} else if (user?.onboardingProgress?.status !== "COMPLETED") {
				router.replace("/onboarding");
			} else {
				loadData();
			}
		}
	}, [isAuthenticated, authLoading, user, router]);

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out", "See you next time!");
			router.push("/login");
		} catch (error) {
			toast.error("Error", "Failed to logout");
		}
	};

	const toggleTheme = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	};

	if (authLoading || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
				<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	const navItems = [
		{ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
		{ icon: User, label: "Profile", path: "/profile" },
		{ icon: FileText, label: "Documents", path: "/documents" },
		{ icon: Settings, label: "Settings", path: "/settings" },
	];

	const handleNavClick = (path: string) => {
		router.push(path);
	};

	return (
		<div className="min-h-screen bg-[var(--color-background)]">
			{/* Sidebar */}
			<aside
				className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
			>
				<div className="flex flex-col h-full">
					{/* Logo */}
					<div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white flex items-center justify-center font-bold">
								O
							</div>
							<span className="font-semibold text-[var(--color-text)]">
								Onboard
							</span>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="lg:hidden text-[var(--color-text-muted)]"
						>
							<X size={20} />
						</button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 p-4 space-y-1">
						{navItems.map((item) => (
							<button
								key={item.label}
								onClick={() => handleNavClick(item.path)}
								className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${
										item.path === "/dashboard"
											? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]"
											: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
									}
                `}
							>
								<item.icon size={20} />
								<span className="font-medium">{item.label}</span>
							</button>
						))}
					</nav>

					{/* User & Logout */}
					<div className="p-4 border-t border-[var(--color-border)]">
						<div className="flex items-center gap-3 mb-4">
							<Avatar
								src={user?.avatarUrl}
								firstName={user?.firstName}
								lastName={user?.lastName}
								className="w-10 h-10 bg-[var(--color-primary-200)] text-[var(--color-primary-700)] font-medium"
							/>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-[var(--color-text)] truncate">
									{user?.firstName} {user?.lastName}
								</p>
								<p className="text-sm text-[var(--color-text-muted)] truncate">
									{user?.email}
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleTheme}
								className="flex-1"
							>
								{resolvedTheme === "dark" ? (
									<Sun size={16} />
								) : (
									<Moon size={16} />
								)}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleLogout}
								className="flex-1"
								leftIcon={<LogOut size={16} />}
							>
								Logout
							</Button>
						</div>
					</div>
				</div>
			</aside>

			{/* Overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main Content */}
			<main className="lg:ml-64">
				{/* Top Bar */}
				<header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden text-[var(--color-text)]"
							>
								<Menu size={24} />
							</button>
							<h1 className="text-xl font-semibold text-[var(--color-text)]">
								Dashboard
							</h1>
						</div>
					</div>
				</header>

				{/* Dashboard Content */}
				<div className="p-6 space-y-6">
					{/* Welcome Banner */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-6 rounded-2xl bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white"
					>
						<h2 className="text-2xl font-bold mb-2">
							Welcome back, {user?.firstName}! 👋
						</h2>
						<p className="opacity-90">
							Your onboarding is complete. Here's an overview of your account.
						</p>
					</motion.div>

					{/* Stats Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card hover>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
									<CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
								</div>
								<div>
									<p className="text-2xl font-bold text-[var(--color-text)]">
										{status?.steps.filter((s) => s.status === "COMPLETED")
											.length || 0}
										/4
									</p>
									<p className="text-sm text-[var(--color-text-muted)]">
										Steps Completed
									</p>
								</div>
							</div>
						</Card>

						<Card hover>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-[var(--color-primary-100)] flex items-center justify-center">
									<FileText className="w-6 h-6 text-[var(--color-primary-600)]" />
								</div>
								<div>
									<p className="text-2xl font-bold text-[var(--color-text)]">
										{documents.length}
									</p>
									<p className="text-sm text-[var(--color-text-muted)]">
										Documents Uploaded
									</p>
								</div>
							</div>
						</Card>

						<Card hover>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center">
									<Clock className="w-6 h-6 text-[var(--color-warning)]" />
								</div>
								<div>
									<p className="text-2xl font-bold text-[var(--color-text)]">
										{user?.createdAt
											? new Date(user.createdAt).toLocaleDateString()
											: "Today"}
									</p>
									<p className="text-sm text-[var(--color-text-muted)]">
										Member Since
									</p>
								</div>
							</div>
						</Card>
					</div>

					{/* Onboarding Summary */}
					<Card>
						<CardTitle>Onboarding Progress</CardTitle>
						<CardDescription>Your completed onboarding steps</CardDescription>
						<div className="mt-4 space-y-3">
							{status?.steps.map((step) => (
								<div
									key={step.id}
									className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-hover)]"
								>
									<div
										className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${
											step.status === "COMPLETED"
												? "bg-[var(--color-success)] text-white"
												: "bg-[var(--color-border)] text-[var(--color-text-muted)]"
										}
                  `}
									>
										{step.status === "COMPLETED" ? (
											<CheckCircle size={16} />
										) : (
											step.stepNumber
										)}
									</div>
									<div className="flex-1">
										<p className="font-medium text-[var(--color-text)]">
											{step.title}
										</p>
										<p className="text-sm text-[var(--color-text-muted)]">
											{step.description}
										</p>
									</div>
									<span
										className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${
											step.status === "COMPLETED"
												? "bg-[var(--color-success-light)] text-[var(--color-success)]"
												: "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
										}
                  `}
									>
										{step.status}
									</span>
								</div>
							))}
						</div>
					</Card>
				</div>
			</main>
		</div>
	);
}
