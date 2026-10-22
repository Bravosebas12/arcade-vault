"use server";

import { Resend } from "resend";
import { buildContactEmail } from "@/features/about/lib/contact-email";
import { validateContactForm } from "@/features/about/lib/contact-form";
import type { ContactActionState, ContactForm } from "@/features/about/model/contact";

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

const field = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Logs why a send failed: only a reason and the error name/message, never the form content. */
const logFailure = (reason: string, error?: { name: string; message: string }) =>
  console.error("[contact] Send failed:", reason, error ? `${error.name}: ${error.message}` : "");

/** Server Action of the contact form: honeypot, validation, env config, then Resend. */
export async function sendContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const form: ContactForm = { name: field(formData, "name"), email: field(formData, "email"), msg: field(formData, "msg") };

  // Bots fill the hidden "website" field: pretend success so they are not told they were caught.
  if (field(formData, "website") !== "") return { status: "sent", name: form.name.trim() };

  if (validateContactForm(form) !== null) return { status: "error", form };

  // Read at request time, inside the action, so the values never reach a client bundle.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
  if (!apiKey || !to) {
    logFailure(!apiKey ? "RESEND_API_KEY is not set" : "CONTACT_TO_EMAIL is not set");
    return { status: "error", form };
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, ...buildContactEmail(form) });
    if (error) {
      logFailure("Resend returned an error", error);
      return { status: "error", form };
    }
  } catch (e) {
    logFailure("Resend request threw", e instanceof Error ? e : { name: "UnknownError", message: String(e) });
    return { status: "error", form };
  }

  return { status: "sent", name: form.name.trim() };
}
