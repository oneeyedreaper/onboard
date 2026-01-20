import React from "react";
// import { cn } from "@/lib/utils";

interface AvatarProps {
	src?: string | null;
	firstName?: string;
	lastName?: string;
	className?: string; // Should include width/height and background colors
	alt?: string;
	initialsClassName?: string; // Optional class for initials text if needed separate from container
}

export function Avatar({
	src,
	firstName,
	lastName,
	className,
	alt = "Avatar",
}: AvatarProps) {
	return (
		<div
			className={`rounded-full flex items-center justify-center overflow-hidden ${
				className || ""
			}`}
		>
			{src ? (
				<img src={src} alt={alt} className="w-full h-full object-cover" />
			) : (
				<>
					{firstName?.[0]}
					{lastName?.[0]}
				</>
			)}
		</div>
	);
}
