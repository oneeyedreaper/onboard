"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import {
	authApi,
	profileApi,
	Profile,
	setTokens,
	clearTokens,
	getAccessToken,
	SESSION_EXPIRED_EVENT,
} from "@/lib/api";

interface AuthContextType {
	user: Profile | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (
		email: string,
		password: string,
		firstName: string,
		lastName: string
	) => Promise<void>;
	logout: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<Profile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshProfile = useCallback(async () => {
		try {
			const profile = await profileApi.get();
			setUser(profile);
		} catch {
			setUser(null);
			clearTokens();
		}
	}, []);

	useEffect(() => {
		const initAuth = async () => {
			const token = getAccessToken();
			if (token) {
				await refreshProfile();
			}
			setIsLoading(false);
		};
		initAuth();
	}, [refreshProfile]);

	// Handle session expired event
	const router = useRouter();
	const pathname = usePathname();
	const toast = useToast();
	const hasHandledExpiry = useRef(false);

	useEffect(() => {
		const handleSessionExpired = () => {
			// Prevent multiple toasts
			if (hasHandledExpiry.current) return;
			hasHandledExpiry.current = true;

			// Don't show toast on public pages
			const publicPages = [
				"/login",
				"/signup",
				"/forgot-password",
				"/reset-password",
				"/verify-email",
			];
			const isPublicPage = publicPages.some((page) =>
				pathname?.startsWith(page)
			);

			if (!isPublicPage) {
				setUser(null);
				toast.warning(
					"Session Expired",
					"Your session has expired. Please log in again."
				);
				router.push("/login");
			}

			// Reset after short delay
			setTimeout(() => {
				hasHandledExpiry.current = false;
			}, 2000);
		};

		window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
		return () =>
			window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
	}, [router, pathname, toast]);

	const login = async (email: string, password: string) => {
		const response = await authApi.login({ email, password });
		setTokens(response.tokens.accessToken, response.tokens.refreshToken);
		await refreshProfile();
	};

	const signup = async (
		email: string,
		password: string,
		firstName: string,
		lastName: string
	) => {
		const response = await authApi.signup({
			email,
			password,
			firstName,
			lastName,
		});
		setTokens(response.tokens.accessToken, response.tokens.refreshToken);
		await refreshProfile();
	};

	const logout = async () => {
		try {
			await authApi.logout();
		} finally {
			setUser(null);
			clearTokens();
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				signup,
				logout,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
