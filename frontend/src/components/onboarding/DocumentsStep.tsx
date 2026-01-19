"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
	ArrowRight,
	FileText,
	Trash2,
	Loader2,
	Upload,
	X,
	CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { documentsApi, Document, UploadDocumentData } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useUploadThing } from "@/lib/uploadthing";

interface DocumentsStepProps {
	onComplete: () => void;
	isSubmitting: boolean;
}

// Document categories for the UI
const DOCUMENT_CATEGORIES: {
	value: UploadDocumentData["category"];
	label: string;
	description: string;
}[] = [
	{
		value: "ID_DOCUMENT",
		label: "ID Document",
		description: "Passport, Driver's License, or National ID",
	},
	{
		value: "BUSINESS_LICENSE",
		label: "Business License",
		description: "Official business registration",
	},
	{
		value: "TAX_DOCUMENT",
		label: "Tax Document",
		description: "Tax registration or certificate",
	},
];

export default function DocumentsStep({
	onComplete,
	isSubmitting,
}: DocumentsStepProps) {
	const toast = useToast();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [uploadingCategory, setUploadingCategory] = useState<string | null>(
		null
	);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

	// UploadThing hook
	const { startUpload, isUploading } = useUploadThing("documentUploader", {
		onUploadProgress: (progress) => {
			setUploadProgress(progress);
		},
		onClientUploadComplete: () => {
			setUploadProgress(0);
		},
		onUploadError: (error) => {
			toast.error("Upload failed", error.message);
			setUploadingCategory(null);
			setUploadProgress(0);
		},
	});

	// Load existing documents
	useEffect(() => {
		const loadDocuments = async () => {
			try {
				const docs = await documentsApi.getAll();
				setDocuments(docs);
			} catch (error) {
				console.error("Failed to load documents");
			} finally {
				setIsLoading(false);
			}
		};
		loadDocuments();
	}, []);

	const handleFileSelect = useCallback(
		async (
			e: React.ChangeEvent<HTMLInputElement>,
			category: UploadDocumentData["category"]
		) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file size (max 8MB)
			if (file.size > 8 * 1024 * 1024) {
				toast.error("File too large", "Maximum file size is 8MB");
				return;
			}

			// Validate file type
			const allowedTypes = [
				"application/pdf",
				"image/jpeg",
				"image/png",
				"image/webp",
			];
			if (!allowedTypes.includes(file.type)) {
				toast.error(
					"Invalid file type",
					"Only PDF, JPEG, PNG, and WebP are allowed"
				);
				return;
			}

			setUploadingCategory(category);

			try {
				// Upload to UploadThing
				const uploadResult = await startUpload([file]);

				if (!uploadResult || uploadResult.length === 0) {
					throw new Error("Upload failed");
				}

				const uploadedFile = uploadResult[0];

				// Save document record to our API
				const newDoc = await documentsApi.add({
					fileName: uploadedFile.name,
					fileUrl: uploadedFile.ufsUrl,
					fileKey: uploadedFile.key,
					fileType: file.type,
					fileSize: uploadedFile.size,
					category,
				});

				setDocuments((prev) => [...prev, newDoc]);
				toast.success(
					"Uploaded!",
					`${file.name} has been uploaded successfully`
				);
			} catch (error: any) {
				toast.error("Upload failed", error.message || "Please try again");
			} finally {
				setUploadingCategory(null);
				// Reset input
				e.target.value = "";
			}
		},
		[startUpload, toast]
	);

	// Process file for upload (used by both file select and drag-drop)
	const processFile = useCallback(
		async (file: File, category: UploadDocumentData["category"]) => {
			// Validate file size (max 8MB)
			if (file.size > 8 * 1024 * 1024) {
				toast.error("File too large", "Maximum file size is 8MB");
				return;
			}

			// Validate file type
			const allowedTypes = [
				"application/pdf",
				"image/jpeg",
				"image/png",
				"image/webp",
			];
			if (!allowedTypes.includes(file.type)) {
				toast.error(
					"Invalid file type",
					"Only PDF, JPEG, PNG, and WebP are allowed"
				);
				return;
			}

			setUploadingCategory(category);

			try {
				// Upload to UploadThing
				const uploadResult = await startUpload([file]);

				if (!uploadResult || uploadResult.length === 0) {
					throw new Error("Upload failed");
				}

				const uploadedFile = uploadResult[0];

				// Save document record to our API
				const newDoc = await documentsApi.add({
					fileName: uploadedFile.name,
					fileUrl: uploadedFile.ufsUrl,
					fileKey: uploadedFile.key,
					fileType: file.type,
					fileSize: uploadedFile.size,
					category,
				});

				setDocuments((prev) => [...prev, newDoc]);
				toast.success(
					"Uploaded!",
					`${file.name} has been uploaded successfully`
				);
			} catch (error: any) {
				toast.error("Upload failed", error.message || "Please try again");
			} finally {
				setUploadingCategory(null);
			}
		},
		[startUpload, toast]
	);

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent, category: string) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOverCategory(category);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOverCategory(null);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, category: UploadDocumentData["category"]) => {
			e.preventDefault();
			e.stopPropagation();
			setDragOverCategory(null);

			const files = e.dataTransfer.files;
			if (files && files.length > 0) {
				processFile(files[0], category);
			}
		},
		[processFile]
	);

	const handleDelete = async (docId: string, fileName: string) => {
		try {
			await documentsApi.delete(docId);
			setDocuments((prev) => prev.filter((d) => d.id !== docId));
			toast.success("Deleted", `${fileName} removed successfully`);
		} catch (error: any) {
			toast.error("Delete failed", error.message);
		}
	};

	const getDocumentForCategory = (category: string) => {
		return documents.find((d) => d.category === category);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-[var(--color-text)]">
					Document Upload
				</h2>
				<p className="text-[var(--color-text-secondary)] mt-1">
					Upload the required documents for verification
				</p>
			</div>

			<div className="space-y-4">
				{DOCUMENT_CATEGORIES.map((cat) => {
					const existingDoc = getDocumentForCategory(cat.value);
					const isUploadingThis = uploadingCategory === cat.value;
					const isDraggingOver = dragOverCategory === cat.value && !existingDoc;

					return (
						<div
							key={cat.value}
							onDragOver={(e) => handleDragOver(e, cat.value)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, cat.value)}
							className={`
                border-2 rounded-lg p-4 bg-[var(--color-surface)] transition-all
                ${
									isDraggingOver
										? "border-dashed border-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-500)]/10"
										: existingDoc
										? "border-solid border-[var(--color-success)]"
										: "border-solid border-[var(--color-border)]"
								}
              `}
						>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-3">
									<div
										className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${
											existingDoc
												? "bg-[var(--color-success-light)] text-[var(--color-success)]"
												: "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]"
										}
                  `}
									>
										{existingDoc ? (
											<CheckCircle size={20} />
										) : (
											<FileText size={20} />
										)}
									</div>
									<div>
										<h3 className="font-medium text-[var(--color-text)]">
											{cat.label}
										</h3>
										<p className="text-sm text-[var(--color-text-muted)]">
											{cat.description}
										</p>
									</div>
								</div>

								{existingDoc ? (
									<button
										onClick={() =>
											handleDelete(existingDoc.id, existingDoc.fileName)
										}
										className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors"
										title="Remove document"
									>
										<Trash2 size={18} />
									</button>
								) : (
									<label className="cursor-pointer">
										<input
											type="file"
											className="hidden"
											accept=".pdf,.jpg,.jpeg,.png,.webp"
											onChange={(e) => handleFileSelect(e, cat.value)}
											disabled={isUploadingThis || isUploading}
										/>
										<div
											className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      ${
												isUploadingThis
													? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]"
													: "bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]"
											}
                      transition-colors
                    `}
										>
											{isUploadingThis ? (
												<>
													<Loader2 size={16} className="animate-spin" />
													{uploadProgress > 0
														? `${uploadProgress}%`
														: "Uploading..."}
												</>
											) : (
												<>
													<Upload size={16} />
													Upload
												</>
											)}
										</div>
									</label>
								)}
							</div>

							{/* Upload Progress Bar */}
							{isUploadingThis && uploadProgress > 0 && (
								<div className="mt-3">
									<div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
										<motion.div
											className="h-full bg-[var(--color-primary-500)]"
											initial={{ width: 0 }}
											animate={{ width: `${uploadProgress}%` }}
											transition={{ duration: 0.3 }}
										/>
									</div>
								</div>
							)}

							{/* Existing Document Info */}
							<AnimatePresence>
								{existingDoc && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										className="mt-3 pt-3 border-t border-[var(--color-border-light)]"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
												<FileText size={14} />
												<span className="truncate max-w-[200px]">
													{existingDoc.fileName}
												</span>
											</div>
											<span className="text-xs text-[var(--color-text-muted)]">
												{formatFileSize(existingDoc.fileSize)}
											</span>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
			</div>

			<p className="text-sm text-[var(--color-text-muted)] mt-4">
				Accepted formats: PDF, JPEG, PNG, WebP (max 8MB each)
			</p>

			<Button
				onClick={onComplete}
				className="w-full mt-6"
				size="lg"
				isLoading={isSubmitting}
				disabled={isUploading}
				rightIcon={<ArrowRight size={18} />}
			>
				Continue
			</Button>
		</div>
	);
}
