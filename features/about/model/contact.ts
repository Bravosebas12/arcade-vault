export type ContactForm = { name: string; email: string; msg: string };

export type ContactField = "name" | "email" | "msg";

/** Result of the sendContact Server Action, consumed by useActionState. */
export type ContactActionState =
  | { status: "idle" }
  | { status: "sent"; name: string } // trimmed name, for "GRACIAS, PX_KAI."
  | { status: "error"; form: ContactForm }; // submitted values, restored on retry
