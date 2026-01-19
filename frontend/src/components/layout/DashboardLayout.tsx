"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
	Shield,
	Activity,
	Users,
	LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

interface NavItem {
	icon: LucideIcon;
	label: string;
	path: string;
}

interface DashboardLayoutProps {
	children: React.ReactNode;
	/** Custom navigation items (optional - defaults to user nav) */
	navItems?: NavItem[];
	/** Page title shown in the top bar */
	title?: string;
	/** Show admin navigation instead of user navigation */
	isAdmin?: boolean;
}

const USER_NAV_ITEMS: NavItem[] = [
	{ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
	{ icon: User, label: "Profile", path: "/profile" },
	{ icon: FileText, label: "Documents", path: "/documents" },
	{ icon: Settings, label: "Settings", path: "/settings" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
	{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
	{ icon: FileText, label: "Documents", path: "/admin/documents" },
	{ icon: Users, label: "Clients", path: "/admin/clients" },
	{ icon: Activity, label: "Activity Log", path: "/admin/activity" },
];

/**
 * Reusable dashboard layout with sidebar navigation
 */
export function DashboardLayout({
	children,
	navItems,
	title,
	isAdmin = false,
}: DashboardLayoutProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);

	const navigation = navItems || (isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS);

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

	const isCurrentPath = (path: string) => {
		if (path === "/dashboard" || path === "/admin") {
			return pathname === path;
		}
		return pathname?.startsWith(path);
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
							<div>
								<span className="font-semibold text-[var(--color-text)]">
									Onboard
								</span>
								{isAdmin && (
									<span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
										Admin
									</span>
								)}
							</div>
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
						{navigation.map((item) => (
							<button
								key={item.label}
								onClick={() => {
									router.push(item.path);
									setSidebarOpen(false);
								}}
								className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                                    ${
																			isCurrentPath(item.path)
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
							<div className="w-10 h-10 rounded-full bg-[var(--color-primary-200)] flex items-center justify-center text-[var(--color-primary-700)] font-medium">
								{user?.firstName?.[0]}
								{user?.lastName?.[0]}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-[var(--color-text)] truncate">
									{user?.firstName} {user?.lastName}
								</p>
								<p className="text-sm text-[var(--color-text-muted)] truncate">
									{user?.email}
								</p>
							</div>
							{isAdmin && (
								<Shield size={16} className="text-[var(--color-primary-500)]" />
							)}
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
				<header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
					<div className="flex items-center justify-between px-4 py-3">
						<div className="flex items-center gap-4">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden text-[var(--color-text-muted)]"
							>
								<Menu size={24} />
							</button>
							{title && (
								<h1 className="text-xl font-semibold text-[var(--color-text)]">
									{title}
								</h1>
							)}
						</div>
					</div>
				</header>

				{/* Page Content */}
				<div className="p-6">{children}</div>
			</main>
		</div>
	);
}

export default DashboardLayout;
