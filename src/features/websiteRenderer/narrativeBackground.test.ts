import { describe, expect, it } from "vitest";
import { resolveNarrativeBackgroundColor } from "./narrativeBackground";

const library = { colors: [{ id: "sage-accent", value: "#748A70" }] } as unknown as import("../websiteCapabilities/types").TemplateDesignLibrary;
const projectColors = [{ id: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3F", value: "#1A1A1A" }];

describe("Narrative background resolution", () => {
  it("resolves template and project namespaces and fails transparent", () => {
    expect(resolveNarrativeBackgroundColor("sage-accent", library, projectColors)).toBe("#748A70");
    expect(resolveNarrativeBackgroundColor(projectColors[0].id, library, projectColors)).toBe("#1A1A1A");
    expect(resolveNarrativeBackgroundColor("missing", library, projectColors)).toBeUndefined();
    expect(resolveNarrativeBackgroundColor(undefined, library, projectColors)).toBeUndefined();
  });
});
