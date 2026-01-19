"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface OfflineBannerProps {
	className?: string;
}

/**
 * Banner that shows when the user is offline
 * Also shows a brief "Back online" message when reconnecting
 */
export function OfflineBanner({ className = "" }: OfflineBannerProps) {
	const { isOffline, isOnline, wasOffline } = useOnlineStatus();

	const showReconnected = isOnline && wasOffline;

	return (
		<AnimatePresence>
			{(isOffline || showReconnected) && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.3 }}
					className={`overflow-hidden ${className}`}
				>
					<div
						className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium ${
							isOffline
								? "bg-yellow-500 text-yellow-950"
								: "bg-green-500 text-green-950"
						}`}
					>
						{isOffline ? (
							<>
								<WifiOff size={16} />
								<span>You&apos;re offline. Some features may not work.</span>
								<button
									onClick={() => window.location.reload()}
									className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-600/30 hover:bg-yellow-600/50 transition-colors"
								>
									<RefreshCw size={12} />
									Retry
								</button>
							</>
						) : (
							<>
								<Wifi size={16} />
								<span>Back online!</span>
							</>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default OfflineBanner;
