import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders without crashing", () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).not.toBeNull();
  });

  it("contains FLOSSK attribution", () => {
    render(<Footer />);
    expect(screen.getByText(/FLOSSK/i)).toBeInTheDocument();
  });
});
