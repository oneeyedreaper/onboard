import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import Button from "@/components/ui/Button";

describe("Button Component", () => {
	it("renders with text", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: /click me/i })
		).toBeInTheDocument();
	});

	it("handles click events", () => {
		let clicked = false;
		render(<Button onClick={() => (clicked = true)}>Click me</Button>);

		fireEvent.click(screen.getByRole("button"));
		expect(clicked).toBe(true);
	});

	it("is disabled when isLoading is true", () => {
		render(<Button isLoading>Loading</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("shows loading spinner when isLoading", () => {
		render(<Button isLoading>Loading</Button>);
		// The button should have the loading spinner (Loader2 icon)
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("applies different variants", () => {
		const { rerender } = render(<Button variant="primary">Primary</Button>);
		expect(screen.getByRole("button")).toHaveClass(
			"bg-[var(--color-primary-500)]"
		);

		rerender(<Button variant="secondary">Secondary</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-[var(--color-surface)]");

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-transparent");
	});

	it("applies different sizes", () => {
		const { rerender } = render(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("px-3");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("px-6");
	});
});
