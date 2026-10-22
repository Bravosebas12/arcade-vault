"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact } from "@/features/about/actions/send-contact";
import { TerminalError } from "@/features/about/components/TerminalError";
import { TerminalSuccess } from "@/features/about/components/TerminalSuccess";
import { CONTACT_LIMITS, validateContactForm } from "@/features/about/lib/contact-form";
import type { ContactActionState, ContactForm as ContactFormValues } from "@/features/about/model/contact";

const emptyForm: ContactFormValues = { name: "", email: "", msg: "" };
const idleState: ContactActionState = { status: "idle" };

// Off-screen bot trap: real visitors never see or tab into it, so any text in it means a bot.
const honeypotStyle: React.CSSProperties = { position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 };

/** Contact form that sends the message to the team with the `sendContact` Server Action (Resend). */
export function ContactForm() {
  // useActionState cannot be reset directly: every restart remounts the inner form with a new key.
  const [formKey, setFormKey] = useState(0);
  const [initial, setInitial] = useState<ContactFormValues>(emptyForm);

  const restart = (values: ContactFormValues) => {
    setInitial(values);
    setFormKey((key) => key + 1);
  };

  // Cache Components keeps the route alive in a hidden <Activity>, which unmounts effects:
  // reset here so coming back shows an empty form, as in the prototype.
  useEffect(
    () => () => {
      setInitial(emptyForm);
      setFormKey((key) => key + 1);
    },
    [],
  );

  return <ContactFormInner key={formKey} initial={initial} onRestart={restart} />;
}

type InnerProps = {
  initial: ContactFormValues;
  /** Remounts the form with these values: empty after sending, the submitted ones to retry. */
  onRestart: (values: ContactFormValues) => void;
};

function ContactFormInner({ initial, onRestart }: InnerProps) {
  const [state, formAction, pending] = useActionState(sendContact, idleState);
  const [form, setForm] = useState<ContactFormValues>(initial);
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  // An invalid form shakes and never reaches the server; a valid one goes on to the action.
  const onSubmit = (e: React.FormEvent) => {
    if (validateContactForm(form) === null) return;
    e.preventDefault();
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 400);
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} action={formAction} onSubmit={onSubmit}>
      {state.status === "sent" ? (
        <TerminalSuccess name={state.name} onReset={() => onRestart(emptyForm)} />
      ) : state.status === "error" ? (
        <TerminalError onRetry={() => onRestart(state.form)} />
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input id="contact-name" name="name" maxLength={CONTACT_LIMITS.name} disabled={pending} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input id="contact-email" name="email" type="email" maxLength={CONTACT_LIMITS.email} disabled={pending} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea id="contact-msg" name="msg" rows={5} maxLength={CONTACT_LIMITS.msg} disabled={pending} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
          </div>
          <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" style={honeypotStyle} />
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>{pending ? "▶  ENVIANDO…" : "▶  ENVIAR MENSAJE"}</button>
        </>
      )}
    </form>
  );
}
