"use client";

import React, { useState, useEffect } from "react";
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
	Loader2,
	Lock,
	Trash2,
	AlertTriangle,
	Shield,
	Key,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { profileApi, clearTokens } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardTitle, CardDescription } from "@/components/ui/Card";

export default function SettingsPage() {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Change password state
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
		{}
	);

	// Delete account state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.replace("/login");
		}
	}, [isAuthenticated, authLoading, router]);

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

	const validatePassword = () => {
		const errors: Record<string, string> = {};

		if (!currentPassword) {
			errors.currentPassword = "Current password is required";
		}
		if (!newPassword) {
			errors.newPassword = "New password is required";
		} else if (newPassword.length < 8) {
			errors.newPassword = "Password must be at least 8 characters";
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
			errors.newPassword =
				"Password must contain uppercase, lowercase, and number";
		}
		if (newPassword !== confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		setPasswordErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleChangePassword = async () => {
		if (!validatePassword()) return;

		setIsChangingPassword(true);
		try {
			await profileApi.changePassword(currentPassword, newPassword);
			toast.success(
				"Password Changed",
				"Your password has been updated successfully."
			);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to change password");
		} finally {
			setIsChangingPassword(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== "DELETE") {
			toast.error("Error", "Please type DELETE to confirm");
			return;
		}

		setIsDeleting(true);
		try {
			await profileApi.deleteAccount();
			clearTokens();
			toast.success(
				"Account Deleted",
				"Your account has been permanently deleted."
			);
			// Use window.location for a full page reload to clear all auth state
			window.location.href = "/login";
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to delete account");
			setIsDeleting(false);
		}
	};

	if (authLoading) {
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

					<nav className="flex-1 p-4 space-y-1">
						{navItems.map((item) => (
							<button
								key={item.label}
								onClick={() => router.push(item.path)}
								className={`
									w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
									${
										item.path === "/settings"
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
							Settings
						</h1>
					</div>
				</header>

				<div className="p-6 space-y-6 max-w-2xl">
					{/* Change Password */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Card>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
									<Key className="w-5 h-5 text-[var(--color-primary-600)]" />
								</div>
								<div>
									<CardTitle>Change Password</CardTitle>
									<CardDescription>
										Update your password to keep your account secure
									</CardDescription>
								</div>
							</div>

							<div className="space-y-4">
								<Input
									type="password"
									label="Current Password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									error={passwordErrors.currentPassword}
									leftIcon={<Lock size={18} />}
								/>
								<Input
									type="password"
									label="New Password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									error={passwordErrors.newPassword}
									helperText="At least 8 characters with uppercase, lowercase, and number"
									leftIcon={<Lock size={18} />}
								/>
								<Input
									type="password"
									label="Confirm New Password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									error={passwordErrors.confirmPassword}
									leftIcon={<Lock size={18} />}
								/>
								<Button
									onClick={handleChangePassword}
									isLoading={isChangingPassword}
									disabled={
										!currentPassword || !newPassword || !confirmPassword
									}
								>
									Update Password
								</Button>
							</div>
						</Card>
					</motion.div>

					{/* Security Info */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<Card>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-lg bg-[var(--color-success-light)] flex items-center justify-center">
									<Shield className="w-5 h-5 text-[var(--color-success)]" />
								</div>
								<div>
									<CardTitle>Account Security</CardTitle>
									<CardDescription>
										Your account security status
									</CardDescription>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
									<span className="text-[var(--color-text)]">Email</span>
									<span className="text-[var(--color-text-muted)]">
										{user?.email}
									</span>
								</div>
								<div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
									<span className="text-[var(--color-text)]">
										Email Verified
									</span>
									<span
										className={
											user?.emailVerified
												? "text-[var(--color-success)]"
												: "text-[var(--color-warning)]"
										}
									>
										{user?.emailVerified ? "Yes" : "No"}
									</span>
								</div>
								<div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
									<span className="text-[var(--color-text)]">Password</span>
									<span className="text-[var(--color-text-muted)]">
										••••••••
									</span>
								</div>
							</div>
						</Card>
					</motion.div>

					{/* Danger Zone */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card className="border-[var(--color-error)] border-opacity-30">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-lg bg-[var(--color-error-light)] flex items-center justify-center">
									<AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
								</div>
								<div>
									<CardTitle className="text-[var(--color-error)]">
										Danger Zone
									</CardTitle>
									<CardDescription>
										Irreversible and destructive actions
									</CardDescription>
								</div>
							</div>

							{!showDeleteConfirm ? (
								<Button
									variant="danger"
									leftIcon={<Trash2 size={16} />}
									onClick={() => setShowDeleteConfirm(true)}
								>
									Delete My Account
								</Button>
							) : (
								<div className="space-y-4 p-4 rounded-lg bg-[var(--color-error-light)] border border-[var(--color-error)] border-opacity-30">
									<p className="text-sm text-[var(--color-error)]">
										This action cannot be undone. All your data will be
										permanently deleted. Type <strong>DELETE</strong> to
										confirm.
									</p>
									<Input
										value={deleteConfirmText}
										onChange={(e) => setDeleteConfirmText(e.target.value)}
										placeholder="Type DELETE to confirm"
									/>
									<div className="flex gap-2">
										<Button
											variant="secondary"
											onClick={() => {
												setShowDeleteConfirm(false);
												setDeleteConfirmText("");
											}}
										>
											Cancel
										</Button>
										<Button
											variant="danger"
											onClick={handleDeleteAccount}
											isLoading={isDeleting}
											disabled={deleteConfirmText !== "DELETE"}
										>
											Permanently Delete Account
										</Button>
									</div>
								</div>
							)}
						</Card>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
