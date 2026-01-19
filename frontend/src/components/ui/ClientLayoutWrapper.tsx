"use client";

import React from "react";
import { OfflineBanner } from "./OfflineBanner";

interface ClientLayoutWrapperProps {
	children: React.ReactNode;
}

/**
 * Client-side wrapper that adds app-wide client features
 * - Offline banner
 * - (Future: global modals, notifications, etc.)
 */
export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
	return (
		<>
			<OfflineBanner />
			{children}
		</>
	);
}

export default ClientLayoutWrapper;
