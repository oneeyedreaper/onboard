"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
	Trash2,
	Download,
	Eye,
	File,
	Image,
	FileSpreadsheet,
	FileType,
	Plus,
	Upload,
	CheckCircle,
	Clock,
	XCircle,
	AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { documentsApi, Document } from "@/lib/api";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import Button from "@/components/ui/Button";
import Card, { CardTitle, CardDescription } from "@/components/ui/Card";

const CATEGORY_LABELS: Record<Document["category"], string> = {
	ID_DOCUMENT: "ID Document",
	BUSINESS_LICENSE: "Business License",
	TAX_DOCUMENT: "Tax Document",
	PROOF_OF_ADDRESS: "Proof of Address",
	OTHER: "Other",
};

const CATEGORY_COLORS: Record<Document["category"], string> = {
	ID_DOCUMENT:
		"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	BUSINESS_LICENSE:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	TAX_DOCUMENT:
		"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	PROOF_OF_ADDRESS:
		"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const VERIFICATION_STATUS_CONFIG = {
	PENDING: {
		label: "Pending Verification",
		icon: Clock,
		bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
		textColor: "text-yellow-700 dark:text-yellow-400",
		borderColor: "border-yellow-300 dark:border-yellow-700",
	},
	APPROVED: {
		label: "Verified",
		icon: CheckCircle,
		bgColor: "bg-green-100 dark:bg-green-900/30",
		textColor: "text-green-700 dark:text-green-400",
		borderColor: "border-green-300 dark:border-green-700",
	},
	REJECTED: {
		label: "Rejected",
		icon: XCircle,
		bgColor: "bg-red-100 dark:bg-red-900/30",
		textColor: "text-red-700 dark:text-red-400",
		borderColor: "border-red-300 dark:border-red-700",
	},
};

function getFileIcon(fileType: string) {
	if (fileType.startsWith("image/")) return Image;
	if (fileType.includes("spreadsheet") || fileType.includes("excel"))
		return FileSpreadsheet;
	if (fileType.includes("pdf")) return FileType;
	return File;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return bytes + " B";
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
	return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentsPage() {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState<
		Document["category"] | "ALL"
	>("ALL");
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Upload modal state
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [uploadCategory, setUploadCategory] =
		useState<Document["category"]>("OTHER");
	const [customDocName, setCustomDocName] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const { startUpload } = useUploadThing("documentUploader");

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.replace("/login");
		} else if (isAuthenticated) {
			loadDocuments();
		}
	}, [isAuthenticated, authLoading, router]);

	const loadDocuments = async () => {
		try {
			const docs = await documentsApi.getAll();
			setDocuments(docs);
		} catch (error: any) {
			toast.error("Error", "Failed to load documents");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			await documentsApi.delete(id);
			setDocuments(documents.filter((d) => d.id !== id));
			toast.success("Deleted", "Document has been deleted");
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to delete document");
		} finally {
			setDeletingId(null);
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

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (acceptedFiles.length === 0) return;

			const file = acceptedFiles[0];
			setIsUploading(true);

			try {
				// Upload file using UploadThing
				const uploadResult = await startUpload([file]);

				if (!uploadResult || uploadResult.length === 0) {
					throw new Error("Upload failed");
				}

				const uploaded = uploadResult[0];

				// Save document to database
				const doc = await documentsApi.add({
					fileName: file.name,
					fileUrl: uploaded.ufsUrl,
					fileKey: uploaded.key,
					fileType: file.type,
					fileSize: file.size,
					category: uploadCategory,
					// Include custom document type name for OTHER category
					customDocType:
						uploadCategory === "OTHER" && customDocName.trim()
							? customDocName.trim()
							: undefined,
				});

				// Add to list and reset form
				setDocuments((prev) => [doc, ...prev]);
				setCustomDocName("");
				setShowUploadModal(false);
				toast.success(
					"Uploaded!",
					"Document uploaded successfully and pending verification."
				);
			} catch (error: any) {
				toast.error(
					"Upload Failed",
					error.message || "Failed to upload document"
				);
			} finally {
				setIsUploading(false);
			}
		},
		[uploadCategory, customDocName, startUpload, toast]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
		},
		maxFiles: 1,
		disabled: isUploading,
	});

	const filteredDocuments =
		selectedCategory === "ALL"
			? documents
			: documents.filter((d) => d.category === selectedCategory);

	// Count pending documents
	const pendingCount = documents.filter(
		(d) => d.verificationStatus === "PENDING"
	).length;

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
										item.path === "/documents"
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
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden text-[var(--color-text)]"
							>
								<Menu size={24} />
							</button>
							<div>
								<h1 className="text-xl font-semibold text-[var(--color-text)]">
									Documents
								</h1>
								{pendingCount > 0 && (
									<p className="text-sm text-[var(--color-text-muted)]">
										{pendingCount} document{pendingCount > 1 ? "s" : ""} pending
										verification
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-3">
							<select
								value={selectedCategory}
								onChange={(e) =>
									setSelectedCategory(
										e.target.value as Document["category"] | "ALL"
									)
								}
								className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
							>
								<option value="ALL">All Categories</option>
								{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
							<Button
								onClick={() => setShowUploadModal(true)}
								leftIcon={<Plus size={18} />}
							>
								Upload
							</Button>
						</div>
					</div>
				</header>

				<div className="p-6">
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Card key={i}>
									<div className="animate-pulse">
										<div className="flex items-start gap-4">
											<div className="w-12 h-12 rounded-lg bg-[var(--color-border)]" />
											<div className="flex-1">
												<div className="h-4 bg-[var(--color-border)] rounded w-3/4 mb-2" />
												<div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
											</div>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : filteredDocuments.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-16"
						>
							<FileText className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
							<h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
								{selectedCategory === "ALL"
									? "No Documents Yet"
									: "No Documents in This Category"}
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-4">
								Upload your documents to get them verified.
							</p>
							<Button
								onClick={() => setShowUploadModal(true)}
								leftIcon={<Upload size={18} />}
							>
								Upload Your First Document
							</Button>
						</motion.div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredDocuments.map((doc, index) => {
								const FileIcon = getFileIcon(doc.fileType);
								const statusConfig =
									VERIFICATION_STATUS_CONFIG[doc.verificationStatus];
								const StatusIcon = statusConfig.icon;

								return (
									<motion.div
										key={doc.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<Card
											hover
											className={`h-full border-l-4 ${statusConfig.borderColor}`}
										>
											{/* Status Badge */}
											<div
												className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-3 ${statusConfig.bgColor} ${statusConfig.textColor}`}
											>
												<StatusIcon size={12} />
												{statusConfig.label}
											</div>

											<div className="flex items-start gap-4">
												<div className="w-12 h-12 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
													<FileIcon className="w-6 h-6 text-[var(--color-primary-600)]" />
												</div>
												<div className="flex-1 min-w-0">
													<h3
														className="font-medium text-[var(--color-text)] truncate"
														title={doc.fileName}
													>
														{doc.fileName}
													</h3>
													<p className="text-sm text-[var(--color-text-muted)]">
														{formatFileSize(doc.fileSize)}
													</p>
													<span
														className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
															CATEGORY_COLORS[doc.category]
														}`}
													>
														{CATEGORY_LABELS[doc.category]}
													</span>
												</div>
											</div>

											{/* Rejection reason */}
											{doc.verificationStatus === "REJECTED" &&
												doc.rejectionReason && (
													<div className="mt-3 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
														<p className="text-xs text-red-700 dark:text-red-400">
															<strong>Reason:</strong> {doc.rejectionReason}
														</p>
													</div>
												)}

											<div className="mt-4 pt-4 border-t border-[var(--color-border-light)] flex items-center justify-between">
												<span className="text-xs text-[var(--color-text-muted)]">
													{new Date(doc.uploadedAt).toLocaleDateString()}
												</span>
												<div className="flex gap-1">
													<a
														href={doc.fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
														title="View"
													>
														<Eye size={16} />
													</a>
													<a
														href={doc.fileUrl}
														download={doc.fileName}
														className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
														title="Download"
													>
														<Download size={16} />
													</a>
													<button
														onClick={() => handleDelete(doc.id)}
														disabled={deletingId === doc.id}
														className="p-2 rounded-lg hover:bg-[var(--color-error-light)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
														title="Delete"
													>
														{deletingId === doc.id ? (
															<Loader2 size={16} className="animate-spin" />
														) : (
															<Trash2 size={16} />
														)}
													</button>
												</div>
											</div>
										</Card>
									</motion.div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			{/* Upload Modal */}
			<AnimatePresence>
				{showUploadModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
						onClick={() => !isUploading && setShowUploadModal(false)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-md p-6"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-[var(--color-text)]">
									Upload Document
								</h2>
								<button
									onClick={() => !isUploading && setShowUploadModal(false)}
									className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
									disabled={isUploading}
								>
									<X size={24} />
								</button>
							</div>

							{/* Category Selector */}
							<div className="mb-4">
								<label className="block text-sm font-medium text-[var(--color-text)] mb-2">
									Document Category
								</label>
								<select
									value={uploadCategory}
									onChange={(e) =>
										setUploadCategory(e.target.value as Document["category"])
									}
									className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
									disabled={isUploading}
								>
									{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
										<option key={key} value={key}>
											{label}
										</option>
									))}
								</select>
							</div>

							{/* Custom Name for OTHER category */}
							{uploadCategory === "OTHER" && (
								<div className="mb-4">
									<label className="block text-sm font-medium text-[var(--color-text)] mb-2">
										Document Name
									</label>
									<input
										type="text"
										value={customDocName}
										onChange={(e) => setCustomDocName(e.target.value)}
										placeholder="e.g., Partnership Agreement, Insurance Certificate"
										className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
										disabled={isUploading}
									/>
									<p className="text-xs text-[var(--color-text-muted)] mt-1">
										Optional: Give your document a descriptive name
									</p>
								</div>
							)}

							{/* Dropzone */}
							<div
								{...getRootProps()}
								className={`
									border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
									${
										isDragActive
											? "border-[var(--color-primary-500)] bg-[var(--color-primary-100)]"
											: "border-[var(--color-border)] hover:border-[var(--color-primary-400)] hover:bg-[var(--color-surface-hover)]"
									}
									${isUploading ? "opacity-50 pointer-events-none" : ""}
								`}
							>
								<input {...getInputProps()} />
								{isUploading ? (
									<div className="flex flex-col items-center">
										<Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-500)] mb-3" />
										<p className="text-[var(--color-text)]">Uploading...</p>
									</div>
								) : (
									<>
										<Upload className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3" />
										<p className="text-[var(--color-text)] font-medium mb-1">
											{isDragActive
												? "Drop the file here"
												: "Drag & drop a file here"}
										</p>
										<p className="text-sm text-[var(--color-text-muted)]">
											or click to browse
										</p>
										<p className="text-xs text-[var(--color-text-muted)] mt-2">
											PDF, Word, or Image files up to 10MB
										</p>
									</>
								)}
							</div>

							{/* Info */}
							<div className="mt-4 p-3 rounded-lg bg-[var(--color-surface-hover)] flex items-start gap-2">
								<AlertCircle
									size={16}
									className="text-[var(--color-primary-500)] mt-0.5 flex-shrink-0"
								/>
								<p className="text-xs text-[var(--color-text-muted)]">
									Documents will be reviewed for verification. You'll be
									notified once the review is complete.
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
