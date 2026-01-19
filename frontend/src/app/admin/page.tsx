"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	LayoutDashboard,
	FileText,
	Users,
	LogOut,
	Menu,
	X,
	Sun,
	Moon,
	CheckCircle,
	Clock,
	XCircle,
	TrendingUp,
	Loader2,
	Shield,
	Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { adminApi, AdminStats } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card, { CardTitle } from "@/components/ui/Card";

export default function AdminDashboard() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		try {
			const data = await adminApi.getStats();
			setStats(data);
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to load stats");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out", "See you next time!");
			router.push("/login");
		} catch {
			toast.error("Error", "Failed to logout");
		}
	};

	const toggleTheme = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	};

	const navItems = [
		{ icon: LayoutDashboard, label: "Dashboard", path: "/admin", active: true },
		{ icon: FileText, label: "Documents", path: "/admin/documents" },
		{ icon: Users, label: "Clients", path: "/admin/clients" },
		{ icon: Activity, label: "Activity Log", path: "/admin/activity" },
	];

	const statCards = [
		{
			title: "Total Clients",
			value: stats?.totalClients || 0,
			icon: Users,
			color: "var(--color-primary-500)",
			bgColor: "var(--color-primary-100)",
		},
		{
			title: "Pending Documents",
			value: stats?.pendingDocuments || 0,
			icon: Clock,
			color: "var(--color-warning)",
			bgColor: "var(--color-warning-light)",
		},
		{
			title: "Approved Documents",
			value: stats?.approvedDocuments || 0,
			icon: CheckCircle,
			color: "var(--color-success)",
			bgColor: "var(--color-success-light)",
		},
		{
			title: "Rejected Documents",
			value: stats?.rejectedDocuments || 0,
			icon: XCircle,
			color: "var(--color-error)",
			bgColor: "var(--color-error-light)",
		},
		{
			title: "Completed Onboarding",
			value: stats?.completedOnboarding || 0,
			icon: TrendingUp,
			color: "var(--color-success)",
			bgColor: "var(--color-success-light)",
		},
	];

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
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold">
								<Shield size={20} />
							</div>
							<span className="font-semibold text-[var(--color-text)]">
								Admin Panel
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
								onClick={() => router.push(item.path)}
								className={`
									w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
									${
										item.active
											? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
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
							<div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-medium">
								{user?.firstName?.[0]}
								{user?.lastName?.[0]}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-[var(--color-text)] truncate">
									{user?.firstName} {user?.lastName}
								</p>
								<p className="text-xs text-red-500 font-medium">
									Administrator
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
								Admin Dashboard
							</h1>
						</div>
						<Button
							onClick={() => router.push("/admin/documents?status=PENDING")}
							leftIcon={<Clock size={16} />}
						>
							Review Pending ({stats?.pendingDocuments || 0})
						</Button>
					</div>
				</header>

				{/* Dashboard Content */}
				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
						</div>
					) : (
						<>
							{/* Stats Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
								{statCards.map((stat, index) => (
									<motion.div
										key={stat.title}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Card className="relative overflow-hidden">
											<div className="flex items-start justify-between">
												<div>
													<p className="text-sm text-[var(--color-text-muted)] mb-1">
														{stat.title}
													</p>
													<p className="text-3xl font-bold text-[var(--color-text)]">
														{stat.value}
													</p>
												</div>
												<div
													className="w-12 h-12 rounded-xl flex items-center justify-center"
													style={{ backgroundColor: stat.bgColor }}
												>
													<stat.icon size={24} style={{ color: stat.color }} />
												</div>
											</div>
										</Card>
									</motion.div>
								))}
							</div>

							{/* Quick Actions */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 }}
							>
								<Card>
									<CardTitle>Quick Actions</CardTitle>
									<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
										<Button
											variant="outline"
											onClick={() =>
												router.push("/admin/documents?status=PENDING")
											}
											leftIcon={<Clock size={16} />}
											className="w-full justify-start"
										>
											Review Pending Documents
										</Button>
										<Button
											variant="outline"
											onClick={() => router.push("/admin/clients")}
											leftIcon={<Users size={16} />}
											className="w-full justify-start"
										>
											View All Clients
										</Button>
										<Button
											variant="outline"
											onClick={() => router.push("/admin/documents")}
											leftIcon={<FileText size={16} />}
											className="w-full justify-start"
										>
											View All Documents
										</Button>
									</div>
								</Card>
							</motion.div>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
