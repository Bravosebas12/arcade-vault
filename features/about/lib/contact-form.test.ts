import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, isContactFormComplete, validateContactForm } from "@/features/about/lib/contact-form";

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

describe("validateContactForm", () => {
  it("returns null for a valid form", () => {
    expect(validateContactForm(filled)).toBeNull();
  });

  it("returns the empty field", () => {
    expect(validateContactForm({ ...filled, name: "" })).toBe("name");
    expect(validateContactForm({ ...filled, email: "" })).toBe("email");
    expect(validateContactForm({ ...filled, msg: "" })).toBe("msg");
  });

  it("returns the whitespace-only field", () => {
    expect(validateContactForm({ ...filled, name: "   " })).toBe("name");
    expect(validateContactForm({ ...filled, email: "\t" })).toBe("email");
    expect(validateContactForm({ ...filled, msg: " \n " })).toBe("msg");
  });

  it("returns the first invalid field in form order", () => {
    expect(validateContactForm({ name: "", email: "", msg: "" })).toBe("name");
    expect(validateContactForm({ ...filled, email: "", msg: "" })).toBe("email");
  });

  it("rejects an email without @ or without a domain", () => {
    expect(validateContactForm({ ...filled, email: "jugadorvault.gg" })).toBe("email");
    expect(validateContactForm({ ...filled, email: "jugador@" })).toBe("email");
    expect(validateContactForm({ ...filled, email: "jugador@vault" })).toBe("email");
    expect(validateContactForm({ ...filled, email: "@vault.gg" })).toBe("email");
  });

  it("trims values before validating", () => {
    expect(validateContactForm({ name: "  px_kai ", email: " jugador@vault.gg ", msg: " Hola " })).toBeNull();
  });

  it("accepts every field exactly at its limit", () => {
    const domain = "@vault.gg";
    const atLimit = {
      name: "a".repeat(CONTACT_LIMITS.name),
      email: "a".repeat(CONTACT_LIMITS.email - domain.length) + domain,
      msg: "a".repeat(CONTACT_LIMITS.msg),
    };
    expect(atLimit.email).toHaveLength(CONTACT_LIMITS.email);
    expect(validateContactForm(atLimit)).toBeNull();
  });

  it("rejects every field one character over its limit", () => {
    const domain = "@vault.gg";
    expect(validateContactForm({ ...filled, name: "a".repeat(CONTACT_LIMITS.name + 1) })).toBe("name");
    expect(validateContactForm({ ...filled, email: "a".repeat(CONTACT_LIMITS.email + 1 - domain.length) + domain })).toBe("email");
    expect(validateContactForm({ ...filled, msg: "a".repeat(CONTACT_LIMITS.msg + 1) })).toBe("msg");
  });
});
