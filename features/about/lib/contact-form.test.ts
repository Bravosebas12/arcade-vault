import { describe, expect, it } from "vitest";
import { isContactFormComplete } from "@/features/about/lib/contact-form";

const filled = { name: "px_kai", email: "jugador@vault.gg", msg: "Hola" };

describe("isContactFormComplete", () => {
  it("is true when every field has text", () => {
    expect(isContactFormComplete(filled)).toBe(true);
  });

  it("is false when any field is empty", () => {
    expect(isContactFormComplete({ ...filled, name: "" })).toBe(false);
    expect(isContactFormComplete({ ...filled, email: "" })).toBe(false);
    expect(isContactFormComplete({ ...filled, msg: "" })).toBe(false);
  });

  it("is false when any field is only whitespace", () => {
    expect(isContactFormComplete({ ...filled, name: "   " })).toBe(false);
    expect(isContactFormComplete({ ...filled, email: "\t" })).toBe(false);
    expect(isContactFormComplete({ ...filled, msg: " \n " })).toBe(false);
  });
});
