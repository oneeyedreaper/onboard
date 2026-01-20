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
	Save,
	XCircle,
	Camera,
	Mail,
	Phone,
	Building2,
	Loader2,
	CheckCircle,
	AlertCircle,
	Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { profileApi, authApi } from "@/lib/api";
import { useUploadThing } from "@/lib/uploadthing";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardTitle, CardDescription } from "@/components/ui/Card";
import Skeleton, {
	SkeletonAvatar,
	SkeletonText,
} from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
	const router = useRouter();
	const {
		user,
		isLoading: authLoading,
		isAuthenticated,
		logout,
		refreshProfile,
	} = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isResendingVerification, setIsResendingVerification] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

	const { startUpload } = useUploadThing("avatarUploader");

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		companyName: "",
		phone: "",
	});

	// Staged avatar: null = no change, string = new URL, "REMOVE" = remove avatar
	const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
	const [pendingAvatarRemove, setPendingAvatarRemove] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.replace("/login");
		} else if (user) {
			setFormData({
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				companyName: user.companyName || "",
				phone: user.phone || "",
			});
		}
	}, [isAuthenticated, authLoading, user, router]);

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

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Build update payload including avatar changes
			const updateData: Record<string, any> = {
				firstName: formData.firstName,
				lastName: formData.lastName,
				companyName: formData.companyName || null,
				phone: formData.phone || null,
			};

			// Include avatar if changed
			if (pendingAvatarRemove) {
				updateData.avatarUrl = null;
			} else if (pendingAvatarUrl) {
				updateData.avatarUrl = pendingAvatarUrl;
			}

			await profileApi.patch(updateData);
			await refreshProfile();

			// Clear pending avatar state
			setPendingAvatarUrl(null);
			setPendingAvatarRemove(false);
			setIsEditing(false);

			toast.success(
				"Profile Updated",
				"Your profile has been saved successfully."
			);
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to update profile");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		// Reset form data to original values
		if (user) {
			setFormData({
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				companyName: user.companyName || "",
				phone: user.phone || "",
			});
		}
		// Clear pending avatar changes
		setPendingAvatarUrl(null);
		setPendingAvatarRemove(false);
		setIsEditing(false);
	};

	const handleResendVerification = async () => {
		setIsResendingVerification(true);
		try {
			await authApi.sendVerificationEmail();
			toast.success(
				"Email Sent",
				"Verification email has been sent. Check your inbox!"
			);
		} catch (error: any) {
			toast.error(
				"Error",
				error.message || "Failed to send verification email"
			);
		} finally {
			setIsResendingVerification(false);
		}
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Invalid File", "Please upload an image file.");
			return;
		}

		// Validate file size (max 4MB)
		if (file.size > 4 * 1024 * 1024) {
			toast.error("File Too Large", "Avatar must be less than 4MB.");
			return;
		}

		setIsUploadingAvatar(true);
		try {
			const uploadResult = await startUpload([file]);
			if (!uploadResult || uploadResult.length === 0) {
				throw new Error("Upload failed");
			}

			const uploaded = uploadResult[0];

			// Stage the new avatar URL (don't save yet)
			setPendingAvatarUrl(uploaded.ufsUrl);
			setPendingAvatarRemove(false);

			toast.info("Photo Selected", "Click 'Save Changes' to apply.");
		} catch (error: any) {
			toast.error("Upload Failed", error.message || "Failed to upload avatar.");
		} finally {
			setIsUploadingAvatar(false);
			// Reset input value so same file can be selected again
			e.target.value = "";
		}
	};

	const handleRemoveAvatar = () => {
		// Stage avatar removal (don't save yet)
		setPendingAvatarRemove(true);
		setPendingAvatarUrl(null);
		toast.info("Photo Marked for Removal", "Click 'Save Changes' to apply.");
	};

	// Get the avatar URL to display (pending changes take priority)
	const displayAvatarUrl = pendingAvatarRemove
		? null
		: pendingAvatarUrl || user?.avatarUrl;

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
								onClick={() => router.push(item.path)}
								className={`
									w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
									${
										item.path === "/profile"
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
								Profile
							</h1>
						</div>
						{!isEditing ? (
							<Button
								onClick={() => setIsEditing(true)}
								leftIcon={<User size={16} />}
							>
								Edit Profile
							</Button>
						) : (
							<div className="flex gap-2">
								<Button
									variant="secondary"
									onClick={handleCancel}
									leftIcon={<XCircle size={16} />}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									isLoading={isSaving}
									leftIcon={<Save size={16} />}
								>
									Save Changes
								</Button>
							</div>
						)}
					</div>
				</header>

				{/* Profile Content */}
				<div className="p-6 space-y-6">
					{/* Avatar and Basic Info */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Card>
							<div className="flex flex-col sm:flex-row items-center gap-6">
								{/* Avatar */}
								<div className="relative">
									<Avatar
										src={displayAvatarUrl}
										firstName={user?.firstName}
										lastName={user?.lastName}
										className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] text-white text-3xl font-bold"
									/>
									{isEditing && (
										<div className="absolute -bottom-2 -right-4 flex gap-2">
											{(displayAvatarUrl || pendingAvatarRemove) &&
												!pendingAvatarRemove && (
													<button
														type="button"
														onClick={handleRemoveAvatar}
														className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
														disabled={isUploadingAvatar}
														title="Remove photo"
													>
														<Trash2 size={14} />
													</button>
												)}
											<>
												<input
													type="file"
													id="avatar-upload"
													className="hidden"
													accept="image/*"
													onChange={handleAvatarUpload}
													disabled={isUploadingAvatar}
												/>
												<label
													htmlFor="avatar-upload"
													className={`w-8 h-8 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-primary-600)] transition-colors cursor-pointer ${
														isUploadingAvatar
															? "opacity-50 pointer-events-none"
															: ""
													}`}
												>
													{isUploadingAvatar ? (
														<Loader2 size={14} className="animate-spin" />
													) : (
														<Camera size={14} />
													)}
												</label>
											</>
										</div>
									)}
								</div>

								{/* Info */}
								<div className="flex-1 text-center sm:text-left">
									<h2 className="text-2xl font-bold text-[var(--color-text)]">
										{user?.firstName} {user?.lastName}
									</h2>
									<p className="text-[var(--color-text-secondary)]">
										{user?.email}
									</p>
									<div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
										{user?.emailVerified ? (
											<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-success-light)] text-[var(--color-success)]">
												<CheckCircle size={12} /> Email Verified
											</span>
										) : (
											<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-warning-light)] text-[var(--color-warning)]">
												<AlertCircle size={12} /> Email Not Verified
											</span>
										)}
									</div>
								</div>

								{/* Resend Verification */}
								{!user?.emailVerified && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleResendVerification}
										isLoading={isResendingVerification}
									>
										Resend Verification
									</Button>
								)}
							</div>
						</Card>
					</motion.div>

					{/* Profile Form */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<Card>
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>Update your personal details</CardDescription>

							<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									label="First Name"
									value={formData.firstName}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
									disabled={!isEditing}
									leftIcon={<User size={18} />}
								/>
								<Input
									label="Last Name"
									value={formData.lastName}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									disabled={!isEditing}
									leftIcon={<User size={18} />}
								/>
								<Input
									label="Company Name"
									value={formData.companyName}
									onChange={(e) =>
										setFormData({ ...formData, companyName: e.target.value })
									}
									disabled={!isEditing}
									placeholder="Optional"
									leftIcon={<Building2 size={18} />}
								/>
								<Input
									label="Phone Number"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									disabled={!isEditing}
									placeholder="Optional"
									leftIcon={<Phone size={18} />}
								/>
							</div>
						</Card>
					</motion.div>

					{/* Account Info */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card>
							<CardTitle>Account Information</CardTitle>
							<CardDescription>Your account details</CardDescription>

							<div className="mt-6 space-y-4">
								<div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-hover)]">
									<Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
									<div>
										<p className="text-sm text-[var(--color-text-muted)]">
											Email Address
										</p>
										<p className="font-medium text-[var(--color-text)]">
											{user?.email}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-hover)]">
									<User className="w-5 h-5 text-[var(--color-text-muted)]" />
									<div>
										<p className="text-sm text-[var(--color-text-muted)]">
											Member Since
										</p>
										<p className="font-medium text-[var(--color-text)]">
											{user?.createdAt
												? new Date(user.createdAt).toLocaleDateString("en-US", {
														year: "numeric",
														month: "long",
														day: "numeric",
												  })
												: "N/A"}
										</p>
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
