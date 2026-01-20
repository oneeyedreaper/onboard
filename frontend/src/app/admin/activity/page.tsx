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
	Loader2,
	Shield,
	ChevronLeft,
	ChevronRight,
	Activity,
	CheckCircle,
	XCircle,
	CheckCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { adminApi, AdminActivityLog } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

const ACTION_LABELS: Record<
	string,
	{ label: string; icon: React.ElementType; color: string }
> = {
	APPROVE_DOCUMENT: {
		label: "Approved Document",
		icon: CheckCircle,
		color: "text-green-500",
	},
	REJECT_DOCUMENT: {
		label: "Rejected Document",
		icon: XCircle,
		color: "text-red-500",
	},
	BULK_APPROVE: {
		label: "Bulk Approved",
		icon: CheckCheck,
		color: "text-green-500",
	},
	APPROVE_ALL_FOR_CLIENT: {
		label: "Approved All for Client",
		icon: CheckCheck,
		color: "text-green-500",
	},
};

export default function AdminActivityPage() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [logs, setLogs] = useState<AdminActivityLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		loadActivityLog();
	}, [page]);

	const loadActivityLog = async () => {
		setIsLoading(true);
		try {
			const result = await adminApi.getActivityLog({ page, limit: 20 });
			setLogs(result.logs || []);
			setTotalPages(result.pagination.totalPages);
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to load activity log");
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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const parseDetails = (details: string | null): Record<string, any> => {
		if (!details) return {};
		try {
			return JSON.parse(details);
		} catch {
			return {};
		}
	};

	const navItems = [
		{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
		{ icon: FileText, label: "Documents", path: "/admin/documents" },
		{ icon: Users, label: "Clients", path: "/admin/clients" },
		{
			icon: Activity,
			label: "Activity Log",
			path: "/admin/activity",
			active: true,
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
							Activity Log
						</h1>
					</div>
				</header>

				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
						</div>
					) : logs.length === 0 ? (
						<Card className="text-center py-12">
							<Activity className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
							<p className="text-[var(--color-text-muted)]">
								No activity logged yet
							</p>
						</Card>
					) : (
						<>
							<div className="space-y-3">
								{logs.map((log, index) => {
									const actionInfo = ACTION_LABELS[log.action] || {
										label: log.action,
										icon: Activity,
										color: "text-gray-500",
									};
									const ActionIcon = actionInfo.icon;
									const details = parseDetails(log.details);

									return (
										<motion.div
											key={log.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.03 }}
										>
											<Card className="p-4">
												<div className="flex items-start gap-4">
													<div
														className={`p-2 rounded-full bg-[var(--color-surface-hover)] ${actionInfo.color}`}
													>
														<ActionIcon size={18} />
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-medium text-[var(--color-text)]">
																{log.admin.firstName} {log.admin.lastName}
															</span>
															<span className="text-[var(--color-text-muted)]">
																•
															</span>
															<span
																className={`font-medium ${actionInfo.color}`}
															>
																{actionInfo.label}
															</span>
														</div>
														<div className="text-sm text-[var(--color-text-muted)] mt-1">
															{details.fileName && (
																<span>Document: {details.fileName}</span>
															)}
															{details.clientEmail && (
																<span> • Client: {details.clientEmail}</span>
															)}
															{details.count && (
																<span>
																	{" "}
																	• Count: {details.count} document(s)
																</span>
															)}
															{details.rejectionReason && (
																<span className="block text-red-500">
																	Reason: {details.rejectionReason}
																</span>
															)}
														</div>
														<p className="text-xs text-[var(--color-text-muted)] mt-2">
															{formatDate(log.createdAt)}
														</p>
													</div>
												</div>
											</Card>
										</motion.div>
									);
								})}
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
