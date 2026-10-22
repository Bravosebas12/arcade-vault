import type { ContactField, ContactForm } from "@/features/about/model/contact";

/** Maximum length of each field, applied to trimmed values and as the inputs' `maxLength`. */
export const CONTACT_LIMITS = { name: 40, email: 254, msg: 2000 } as const;

const FIELDS: readonly ContactField[] = ["name", "email", "msg"];

// Something before "@", and a domain with at least one dot after it.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same rule as the prototype: every field must have non-whitespace text. The email format is left to `type="email"`. */
export const isContactFormComplete = (form: ContactForm): boolean =>
  form.name.trim() !== "" && form.email.trim() !== "" && form.msg.trim() !== "";

/** Returns the first invalid field (empty, too long or, for the email, malformed) or `null`. Shared by client and server. */
export function validateContactForm(form: ContactForm): ContactField | null {
  for (const field of FIELDS) {
    const value = form[field].trim();
    if (value === "" || value.length > CONTACT_LIMITS[field]) return field;
    if (field === "email" && !EMAIL_PATTERN.test(value)) return field;
  }
  return null;
}
