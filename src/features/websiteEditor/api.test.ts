import { describe, expect, it } from "vitest";
import { canonicalizeWebsiteSectionContentForApi } from "./api";

describe("Website section API serialization", () => {
  it("canonicalizes a legacy empty Hero background media sentinel before save", () => {
    const content = {
      backgroundMedia: "",
      childFlow: { elements: [], order: [] },
    };

    expect(canonicalizeWebsiteSectionContentForApi(content)).toEqual({
      backgroundMedia: null,
      childFlow: { elements: [], order: [] },
    });
    expect(content.backgroundMedia).toBe("");
  });
});
