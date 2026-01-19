import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/components/ui/Toast";

// Mock AuthProvider since it makes API calls
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
	return <>{children}</>;
};

// All providers wrapper for testing
const AllProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider>
			<ToastProvider>
				<MockAuthProvider>{children}</MockAuthProvider>
			</ToastProvider>
		</ThemeProvider>
	);
};

// Custom render that includes all providers
const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing library
export * from "@testing-library/react";

// Override render with our custom render
export { customRender as render };
