"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
	Eye,
	Download,
	Loader2,
	Shield,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	ChevronUp,
	User,
	Search,
	CheckCheck,
	Calendar,
	Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/Toast";
import { adminApi, AdminDocument, Document } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import { Avatar } from "@/components/ui/Avatar";

const STATUS_COLORS: Record<
	Document["verificationStatus"],
	{ bg: string; text: string; icon: React.ElementType }
> = {
	PENDING: {
		bg: "bg-yellow-100 dark:bg-yellow-900/30",
		text: "text-yellow-600 dark:text-yellow-400",
		icon: Clock,
	},
	APPROVED: {
		bg: "bg-green-100 dark:bg-green-900/30",
		text: "text-green-600 dark:text-green-400",
		icon: CheckCircle,
	},
	REJECTED: {
		bg: "bg-red-100 dark:bg-red-900/30",
		text: "text-red-600 dark:text-red-400",
		icon: XCircle,
	},
};

const CATEGORY_LABELS: Record<string, string> = {
	ID_DOCUMENT: "ID Document",
	BUSINESS_LICENSE: "Business License",
	TAX_DOCUMENT: "Tax Document",
	PROOF_OF_ADDRESS: "Proof of Address",
	OTHER: "Other",
};

interface GroupedDocuments {
	client: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		avatarUrl?: string | null;
	};
	documents: AdminDocument[];
	pendingCount: number;
}

export default function AdminDocuments() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, logout } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const toast = useToast();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [documents, setDocuments] = useState<AdminDocument[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<
		Document["verificationStatus"] | "ALL"
	>((searchParams.get("status") as Document["verificationStatus"]) || "ALL");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [rejectionModal, setRejectionModal] = useState<{
		id: string;
		fileName: string;
	} | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [expandedClients, setExpandedClients] = useState<Set<string>>(
		new Set()
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [approvingClientId, setApprovingClientId] = useState<string | null>(
		null
	);
	const [previewDoc, setPreviewDoc] = useState<{
		fileName: string;
		fileUrl: string;
		fileType: string;
	} | null>(null);

	useEffect(() => {
		const debounce = setTimeout(
			() => {
				loadDocuments();
			},
			searchQuery ? 300 : 0
		);
		return () => clearTimeout(debounce);
	}, [statusFilter, page, searchQuery]);

	const loadDocuments = async () => {
		setIsLoading(true);
		try {
			const params: {
				status?: Document["verificationStatus"];
				page: number;
				limit: number;
				search?: string;
			} = { page, limit: 100 }; // Get more docs to group properly
			if (statusFilter !== "ALL") {
				params.status = statusFilter;
			}
			if (searchQuery.trim()) {
				params.search = searchQuery.trim();
			}
			const result = await adminApi.getDocuments(params);
			setDocuments(result.documents || []);
			setTotalPages(result.pagination.totalPages);
			// Expand all clients by default when viewing pending
			if (statusFilter === "PENDING") {
				const clientIds = new Set(
					(result.documents || []).map((d) => d.client.id)
				);
				setExpandedClients(clientIds);
			}
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to load documents");
		} finally {
			setIsLoading(false);
		}
	};

	// Group documents by client
	const groupedDocuments = useMemo(() => {
		const groups: Record<string, GroupedDocuments> = {};

		documents.forEach((doc) => {
			const clientId = doc.client.id;
			if (!groups[clientId]) {
				groups[clientId] = {
					client: doc.client,
					documents: [],
					pendingCount: 0,
				};
			}
			groups[clientId].documents.push(doc);
			if (doc.verificationStatus === "PENDING") {
				groups[clientId].pendingCount++;
			}
		});

		// Sort by pending count (clients with most pending first)
		return Object.values(groups).sort(
			(a, b) => b.pendingCount - a.pendingCount
		);
	}, [documents]);

	const toggleClientExpanded = (clientId: string) => {
		setExpandedClients((prev) => {
			const next = new Set(prev);
			if (next.has(clientId)) {
				next.delete(clientId);
			} else {
				next.add(clientId);
			}
			return next;
		});
	};

	const expandAll = () => {
		setExpandedClients(new Set(groupedDocuments.map((g) => g.client.id)));
	};

	const collapseAll = () => {
		setExpandedClients(new Set());
	};

	const handleApproveAllForClient = async (clientId: string) => {
		setApprovingClientId(clientId);
		try {
			const result = await adminApi.approveAllForClient(clientId);
			toast.success(
				"Approved",
				`${result.approvedCount} document(s) approved.`
			);
			loadDocuments();
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to approve documents");
		} finally {
			setApprovingClientId(null);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const handleApprove = async (id: string) => {
		setProcessingId(id);
		try {
			await adminApi.updateDocumentStatus(id, { status: "APPROVED" });
			toast.success("Approved", "Document has been approved.");
			loadDocuments();
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to approve document");
		} finally {
			setProcessingId(null);
		}
	};

	const handleReject = async () => {
		if (!rejectionModal) return;
		setProcessingId(rejectionModal.id);
		try {
			await adminApi.updateDocumentStatus(rejectionModal.id, {
				status: "REJECTED",
				rejectionReason: rejectionReason || undefined,
			});
			toast.success("Rejected", "Document has been rejected.");
			setRejectionModal(null);
			setRejectionReason("");
			loadDocuments();
		} catch (error: any) {
			toast.error("Error", error.message || "Failed to reject document");
		} finally {
			setProcessingId(null);
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
		{
			icon: FileText,
			label: "Documents",
			path: "/admin/documents",
			active: true,
		},
		{ icon: Users, label: "Clients", path: "/admin/clients" },
		{ icon: Activity, label: "Activity Log", path: "/admin/activity" },
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
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div className="flex items-center gap-4">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden text-[var(--color-text)]"
							>
								<Menu size={24} />
							</button>
							<h1 className="text-xl font-semibold text-[var(--color-text)]">
								Document Review
							</h1>
						</div>
						{/* Search bar */}
						<div className="relative w-full sm:w-64">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
							<input
								type="text"
								placeholder="Search by client..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setPage(1);
								}}
								className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
							/>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<div className="flex gap-1 mr-2">
								<button
									onClick={expandAll}
									className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
								>
									Expand All
								</button>
								<button
									onClick={collapseAll}
									className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
								>
									Collapse All
								</button>
							</div>
							{(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
								(status) => (
									<button
										key={status}
										onClick={() => {
											setStatusFilter(status);
											setPage(1);
										}}
										className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
											statusFilter === status
												? "bg-[var(--color-primary-500)] text-white"
												: "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
										}`}
									>
										{status === "ALL"
											? "All"
											: status.charAt(0) + status.slice(1).toLowerCase()}
									</button>
								)
							)}
						</div>
					</div>
				</header>

				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
						</div>
					) : groupedDocuments.length === 0 ? (
						<Card className="text-center py-12">
							<FileText className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
							<p className="text-[var(--color-text-muted)]">
								No documents found
							</p>
						</Card>
					) : (
						<div className="space-y-4">
							{groupedDocuments.map((group, groupIndex) => {
								const isExpanded = expandedClients.has(group.client.id);
								return (
									<motion.div
										key={group.client.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: groupIndex * 0.05 }}
									>
										<Card className="overflow-hidden">
											{/* Client Header */}
											<div className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
												<div
													className="flex items-center gap-4 flex-1"
													onClick={() => toggleClientExpanded(group.client.id)}
												>
													<Avatar
														src={group.client.avatarUrl}
														firstName={group.client.firstName}
														lastName={group.client.lastName}
														className="w-12 h-12 bg-[var(--color-primary-200)] text-[var(--color-primary-700)] font-medium"
													/>
													<div className="text-left">
														<p className="font-medium text-[var(--color-text)]">
															{group.client.firstName} {group.client.lastName}
														</p>
														<p className="text-sm text-[var(--color-text-muted)]">
															{group.client.email}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-4">
													<div className="flex items-center gap-2">
														<span className="text-sm text-[var(--color-text-secondary)]">
															{group.documents.length} document
															{group.documents.length !== 1 ? "s" : ""}
														</span>
														{group.pendingCount > 0 && (
															<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
																{group.pendingCount} pending
															</span>
														)}
													</div>
													{group.pendingCount > 0 && (
														<Button
															size="sm"
															onClick={() =>
																handleApproveAllForClient(group.client.id)
															}
															isLoading={approvingClientId === group.client.id}
															leftIcon={<CheckCheck size={14} />}
															className="bg-green-500 hover:bg-green-600"
														>
															Approve All
														</Button>
													)}
													<div
														onClick={() =>
															toggleClientExpanded(group.client.id)
														}
														className="p-1 hover:bg-[var(--color-surface)] rounded cursor-pointer"
													>
														{isExpanded ? (
															<ChevronUp size={20} />
														) : (
															<ChevronDown size={20} />
														)}
													</div>
												</div>
											</div>

											{/* Documents List */}
											<AnimatePresence>
												{isExpanded && (
													<motion.div
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.2 }}
														className="overflow-hidden"
													>
														<div className="border-t border-[var(--color-border)]">
															{group.documents.map((doc) => {
																const statusStyle =
																	STATUS_COLORS[doc.verificationStatus];
																const StatusIcon = statusStyle.icon;
																return (
																	<div
																		key={doc.id}
																		className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-[var(--color-border)] last:border-b-0 bg-[var(--color-surface-hover)]/30"
																	>
																		<div className="flex items-start gap-3">
																			<FileText className="w-5 h-5 text-[var(--color-text-muted)] mt-0.5" />
																			<div>
																				<p className="font-medium text-[var(--color-text)]">
																					{doc.fileName}
																				</p>
																				<div className="flex items-center gap-2 mt-1 flex-wrap">
																					<span className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
																						{doc.category === "OTHER" &&
																						doc.customDocType
																							? `Other: ${doc.customDocType}`
																							: CATEGORY_LABELS[doc.category] ||
																							  doc.category}
																					</span>
																					<span
																						className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}
																					>
																						<StatusIcon size={12} />
																						{doc.verificationStatus}
																					</span>
																					{doc.rejectionReason && (
																						<span className="text-xs text-red-500">
																							Reason: {doc.rejectionReason}
																						</span>
																					)}
																					<span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
																						<Calendar size={10} />
																						{formatDate(doc.uploadedAt)}
																					</span>
																				</div>
																			</div>
																		</div>
																		<div className="flex items-center gap-2 ml-8 md:ml-0">
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					window.open(doc.fileUrl, "_blank")
																				}
																				leftIcon={<Eye size={14} />}
																			>
																				View
																			</Button>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					setPreviewDoc({
																						fileName: doc.fileName,
																						fileUrl: doc.fileUrl,
																						fileType: doc.fileType,
																					})
																				}
																				leftIcon={<Eye size={14} />}
																			>
																				Preview
																			</Button>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => {
																					const a = document.createElement("a");
																					a.href = doc.fileUrl;
																					a.download = doc.fileName;
																					a.click();
																				}}
																				leftIcon={<Download size={14} />}
																			>
																				Download
																			</Button>
																			{doc.verificationStatus === "PENDING" && (
																				<>
																					<Button
																						size="sm"
																						onClick={() =>
																							handleApprove(doc.id)
																						}
																						isLoading={processingId === doc.id}
																						leftIcon={<CheckCircle size={14} />}
																						className="bg-green-500 hover:bg-green-600"
																					>
																						Approve
																					</Button>
																					<Button
																						variant="secondary"
																						size="sm"
																						onClick={() =>
																							setRejectionModal({
																								id: doc.id,
																								fileName: doc.fileName,
																							})
																						}
																						disabled={processingId === doc.id}
																						leftIcon={<XCircle size={14} />}
																						className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
																					>
																						Reject
																					</Button>
																				</>
																			)}
																		</div>
																	</div>
																);
															})}
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</Card>
									</motion.div>
								);
							})}
						</div>
					)}

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
				</div>
			</main>

			{/* Rejection Modal */}
			<AnimatePresence>
				{rejectionModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
						onClick={() => setRejectionModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-md p-6"
							onClick={(e) => e.stopPropagation()}
						>
							<h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
								Reject Document
							</h2>
							<p className="text-sm text-[var(--color-text-muted)] mb-4">
								You are about to reject:{" "}
								<strong>{rejectionModal.fileName}</strong>
							</p>
							<textarea
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Reason for rejection (optional)"
								className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] resize-none h-24 mb-4"
							/>
							<div className="flex gap-3">
								<Button
									variant="secondary"
									onClick={() => setRejectionModal(null)}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									onClick={handleReject}
									isLoading={processingId === rejectionModal.id}
									className="flex-1 bg-red-500 hover:bg-red-600"
								>
									Reject Document
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Document Preview Modal */}
			<DocumentPreviewModal
				isOpen={!!previewDoc}
				onClose={() => setPreviewDoc(null)}
				document={previewDoc}
			/>
		</div>
	);
}
