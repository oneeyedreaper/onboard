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
	XCircle,
	Loader2,
	Shield,
	ChevronLeft,
	ChevronRight,
	Mail,
	Clock,
	Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { adminApi, AdminClient } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminClients() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [clients, setClients] = useState<AdminClient[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		loadClients();
	}, [page]);

	const loadClients = async () => {
		setIsLoading(true);
		try {
			const result = await adminApi.getClients({ page });
			setClients(result.clients || []);
			setTotalPages(result.pagination.totalPages);
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to load clients");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/login");
		} catch {
			toast.error("Error", "Failed to logout");
		}
	};

	const toggleTheme = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	};

	const navItems = [
		{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
		{ icon: FileText, label: "Documents", path: "/admin/documents" },
		{ icon: Users, label: "Clients", path: "/admin/clients", active: true },
		{ icon: Activity, label: "Activity Log", path: "/admin/activity" },
	];

	const getStatusBadge = (status?: string) => {
		switch (status) {
			case "COMPLETED":
				return (
					<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
						<CheckCircle size={12} /> Completed
					</span>
				);
			case "IN_PROGRESS":
				return (
					<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
						<Clock size={12} /> In Progress
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
						<Clock size={12} /> Pending
					</span>
				);
		}
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

					<div className="p-4 border-t border-[var(--color-border)]">
						<div className="flex items-center gap-3 mb-4">
							<Avatar
								src={user?.avatarUrl}
								firstName={user?.firstName}
								lastName={user?.lastName}
								className="w-10 h-10 bg-red-200 text-red-700 font-medium"
							/>
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

			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main Content */}
			<main className="lg:ml-64">
				<header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-4">
					<div className="flex items-center gap-4">
						<button
							onClick={() => setSidebarOpen(true)}
							className="lg:hidden text-[var(--color-text)]"
						>
							<Menu size={24} />
						</button>
						<h1 className="text-xl font-semibold text-[var(--color-text)]">
							All Clients
						</h1>
					</div>
				</header>

				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
						</div>
					) : clients.length === 0 ? (
						<Card className="text-center py-12">
							<Users className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
							<p className="text-[var(--color-text-muted)]">No clients found</p>
						</Card>
					) : (
						<>
							<div className="grid gap-4">
								{clients.map((client, index) => (
									<motion.div
										key={client.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<Card>
											<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
												<div className="flex items-center gap-4">
													<Avatar
														src={client.avatarUrl}
														firstName={client.firstName}
														lastName={client.lastName}
														className="w-12 h-12 bg-[var(--color-primary-200)] text-[var(--color-primary-700)] font-medium text-lg"
													/>
													<div>
														<p className="font-medium text-[var(--color-text)]">
															{client.firstName} {client.lastName}
														</p>
														<div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
															<Mail size={14} />
															{client.email}
														</div>
														{client.companyName && (
															<p className="text-sm text-[var(--color-text-secondary)]">
																{client.companyName}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-4">
													<div className="text-right">
														<div className="flex items-center gap-2 mb-1">
															{client.emailVerified ? (
																<span className="inline-flex items-center gap-1 text-xs text-green-600">
																	<CheckCircle size={12} /> Verified
																</span>
															) : (
																<span className="inline-flex items-center gap-1 text-xs text-yellow-600">
																	<XCircle size={12} /> Unverified
																</span>
															)}
														</div>
														{getStatusBadge(client.onboardingProgress?.status)}
													</div>
													<div className="text-center px-4 py-2 rounded-lg bg-[var(--color-surface-hover)]">
														<p className="text-2xl font-bold text-[var(--color-text)]">
															{client._count.documents}
														</p>
														<p className="text-xs text-[var(--color-text-muted)]">
															Documents
														</p>
													</div>
												</div>
											</div>
										</Card>
									</motion.div>
								))}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex items-center justify-center gap-2 mt-6">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
									>
										<ChevronLeft size={16} />
									</Button>
									<span className="text-sm text-[var(--color-text-secondary)]">
										Page {page} of {totalPages}
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page === totalPages}
									>
										<ChevronRight size={16} />
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</main>
		</div>
	);
}
