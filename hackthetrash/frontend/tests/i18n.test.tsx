import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/lib/i18n";

function Probe() {
  const { t } = useI18n();
  return (
    <div>
      <span data-testid="tagline">{t("app.tagline")}</span>
      <span data-testid="map">{t("nav.map")}</span>
      <span data-testid="missing">{t("does.not.exist")}</span>
    </div>
  );
}

describe("I18nProvider", () => {
  it("returns the English tagline by default", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("tagline").textContent).toMatch(/Pristina/);
    expect(screen.getByTestId("map").textContent).toBe("Map");
  });

  it("falls back to the key for unknown lookups", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("missing").textContent).toBe("does.not.exist");
  });
});
