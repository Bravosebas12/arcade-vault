import type { ContactForm } from "@/features/about/model/contact";

export type ContactEmail = { subject: string; text: string; replyTo: string };

/** Plain-text email sent to the team; the visitor's address only goes in `replyTo` and the body. */
export function buildContactEmail(form: ContactForm): ContactEmail {
  const name = form.name.trim();
  const email = form.email.trim();
  return {
    subject: `[Arcade Vault] Mensaje de ${name}`,
    replyTo: email,
    text: `Nombre: ${name}\nCorreo: ${email}\n\n${form.msg.trim()}`,
  };
}
