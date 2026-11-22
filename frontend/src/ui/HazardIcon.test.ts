import { describe, expect, it } from "vitest";

import { HAZARD_INFO } from "../news/hazards";
import { GLYPHS } from "./HazardIcon";

describe("hazard glyphs", () => {
  it("has a drawn glyph for every hazard", () => {
    for (const hazard of Object.keys(HAZARD_INFO) as (keyof typeof HAZARD_INFO)[]) {
      expect(GLYPHS[hazard].fill ?? GLYPHS[hazard].line, hazard).toMatch(/^M/);
    }
  });
});
