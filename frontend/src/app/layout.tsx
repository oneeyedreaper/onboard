import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientLayoutWrapper } from "@/components/ui/ClientLayoutWrapper";

export const metadata: Metadata = {
	title: {
		default: "Onboard - Client Onboarding Platform",
		template: "%s | Onboard",
	},
	description:
		"Streamline your client onboarding with secure document collection, verification, and progress tracking. A modern platform for professional services.",
	keywords: [
		"client onboarding",
		"document verification",
		"KYC",
		"client management",
		"secure onboarding",
	],
	authors: [{ name: "Onboard Team" }],
	creator: "Onboard",
	publisher: "Onboard",
	robots: {
		index: true,
		follow: true,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Onboard",
		title: "Onboard - Client Onboarding Platform",
		description:
			"Streamline your client onboarding with secure document collection and verification.",
	},
	twitter: {
		card: "summary_large_image",
		title: "Onboard - Client Onboarding Platform",
		description:
			"Streamline your client onboarding with secure document collection and verification.",
	},
	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="antialiased">
				<ThemeProvider>
					<ToastProvider>
						<AuthProvider>
							<ClientLayoutWrapper>{children}</ClientLayoutWrapper>
						</AuthProvider>
					</ToastProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
