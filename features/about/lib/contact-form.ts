import type { ContactForm } from "@/features/about/model/contact";

/** Same rule as the prototype: every field must have non-whitespace text. The email format is left to `type="email"`. */
export const isContactFormComplete = (form: ContactForm): boolean =>
  form.name.trim() !== "" && form.email.trim() !== "" && form.msg.trim() !== "";
