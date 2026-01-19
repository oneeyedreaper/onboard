"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Download,
	ExternalLink,
	ZoomIn,
	ZoomOut,
	RotateCw,
	FileText,
	Loader2,
} from "lucide-react";
import Button from "./Button";

interface DocumentPreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	document: {
		fileName: string;
		fileUrl: string;
		fileType: string;
	} | null;
}

/**
 * Modal for previewing documents (images and PDFs)
 */
export function DocumentPreviewModal({
	isOpen,
	onClose,
	document,
}: DocumentPreviewModalProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [error, setError] = useState(false);

	// Reset state when modal opens
	React.useEffect(() => {
		if (isOpen) {
			setIsLoading(true);
			setZoom(1);
			setRotation(0);
			setError(false);
		}
	}, [isOpen, document?.fileUrl]);

	// Handle escape key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!document) return null;

	const isImage = document.fileType.startsWith("image/");
	const isPdf = document.fileType === "application/pdf";

	const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
	const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
	const handleRotate = () => setRotation((r) => (r + 90) % 360);

	const handleDownload = () => {
		window.open(document.fileUrl, "_blank");
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", duration: 0.3 }}
						className="fixed inset-4 z-50 flex flex-col bg-[var(--color-surface)] rounded-xl shadow-2xl overflow-hidden"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
							<div className="flex items-center gap-3 min-w-0">
								<FileText
									size={20}
									className="text-[var(--color-primary-500)] flex-shrink-0"
								/>
								<span className="font-medium text-[var(--color-text)] truncate">
									{document.fileName}
								</span>
							</div>

							<div className="flex items-center gap-2">
								{/* Zoom controls (for images only) */}
								{isImage && (
									<>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleZoomOut}
											disabled={zoom <= 0.5}
											title="Zoom out"
										>
											<ZoomOut size={18} />
										</Button>
										<span className="text-sm text-[var(--color-text-muted)] min-w-[3rem] text-center">
											{Math.round(zoom * 100)}%
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleZoomIn}
											disabled={zoom >= 3}
											title="Zoom in"
										>
											<ZoomIn size={18} />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleRotate}
											title="Rotate"
										>
											<RotateCw size={18} />
										</Button>
										<div className="w-px h-6 bg-[var(--color-border)] mx-1" />
									</>
								)}

								<Button
									variant="ghost"
									size="sm"
									onClick={handleDownload}
									title="Open in new tab"
									leftIcon={<ExternalLink size={16} />}
								>
									Open
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDownload}
									title="Download"
									leftIcon={<Download size={16} />}
								>
									Download
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={onClose}
									title="Close"
								>
									<X size={20} />
								</Button>
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-auto bg-[var(--color-background)] flex items-center justify-center p-4">
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-[var(--color-background)]">
									<Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
								</div>
							)}

							{error && (
								<div className="text-center">
									<FileText
										size={48}
										className="mx-auto mb-4 text-[var(--color-text-muted)]"
									/>
									<p className="text-[var(--color-text-muted)]">
										Unable to preview this document
									</p>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleDownload}
										className="mt-4"
										leftIcon={<Download size={16} />}
									>
										Download Instead
									</Button>
								</div>
							)}

							{isImage && !error && (
								<motion.img
									src={document.fileUrl}
									alt={document.fileName}
									onLoad={() => setIsLoading(false)}
									onError={() => {
										setIsLoading(false);
										setError(true);
									}}
									style={{
										transform: `scale(${zoom}) rotate(${rotation}deg)`,
										transition: "transform 0.2s ease-out",
									}}
									className={`max-w-full max-h-full object-contain ${
										isLoading ? "invisible" : "visible"
									}`}
									draggable={false}
								/>
							)}

							{isPdf && !error && (
								<iframe
									src={`${document.fileUrl}#toolbar=0`}
									title={document.fileName}
									onLoad={() => setIsLoading(false)}
									onError={() => {
										setIsLoading(false);
										setError(true);
									}}
									className={`w-full h-full rounded border border-[var(--color-border)] ${
										isLoading ? "invisible" : "visible"
									}`}
								/>
							)}

							{!isImage && !isPdf && !error && (
								<div className="text-center">
									<FileText
										size={48}
										className="mx-auto mb-4 text-[var(--color-text-muted)]"
									/>
									<p className="text-[var(--color-text-muted)]">
										Preview not available for this file type
									</p>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleDownload}
										className="mt-4"
										leftIcon={<Download size={16} />}
									>
										Download File
									</Button>
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

export default DocumentPreviewModal;
