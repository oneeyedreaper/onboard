"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, User, Building, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Profile } from "@/lib/api";

const personalInfoSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(50),
	lastName: z.string().min(1, "Last name is required").max(50),
	companyName: z.string().max(100).optional(),
	phone: z.string().max(20).optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
	initialData?: Profile | null;
	onComplete: (data: PersonalInfoData) => void;
	isSubmitting: boolean;
}

export default function PersonalInfoStep({
	initialData,
	onComplete,
	isSubmitting,
}: PersonalInfoStepProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<PersonalInfoData>({
		resolver: zodResolver(personalInfoSchema),
		defaultValues: {
			firstName: initialData?.firstName || "",
			lastName: initialData?.lastName || "",
			companyName: initialData?.companyName || "",
			phone: initialData?.phone || "",
		},
	});

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-[var(--color-text)]">
					Personal Information
				</h2>
				<p className="text-[var(--color-text-secondary)] mt-1">
					Tell us a bit about yourself and your company
				</p>
			</div>

			<form onSubmit={handleSubmit(onComplete)} className="space-y-5">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Input
						{...register("firstName")}
						label="First Name"
						placeholder="John"
						leftIcon={<User size={18} />}
						error={errors.firstName?.message}
					/>
					<Input
						{...register("lastName")}
						label="Last Name"
						placeholder="Doe"
						error={errors.lastName?.message}
					/>
				</div>

				<Input
					{...register("companyName")}
					label="Company Name (Optional)"
					placeholder="Your company name"
					leftIcon={<Building size={18} />}
					error={errors.companyName?.message}
				/>

				<Input
					{...register("phone")}
					label="Phone Number (Optional)"
					placeholder="+1 (555) 123-4567"
					leftIcon={<Phone size={18} />}
					error={errors.phone?.message}
				/>

				<Button
					type="submit"
					className="w-full"
					size="lg"
					isLoading={isSubmitting}
					rightIcon={<ArrowRight size={18} />}
				>
					Continue
				</Button>
			</form>
		</div>
	);
}
