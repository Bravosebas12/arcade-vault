"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalSuccess } from "@/features/about/components/TerminalSuccess";
import { isContactFormComplete } from "@/features/about/lib/contact-form";
import type { ContactForm as ContactFormValues } from "@/features/about/model/contact";

const emptyForm: ContactFormValues = { name: "", email: "", msg: "" };

/** Simulated contact form: validates and shows a terminal, but sends and stores nothing. */
export function ContactForm() {
  const [form, setForm] = useState<ContactFormValues>(emptyForm);
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cache Components keeps the route alive in a hidden <Activity>, which unmounts effects:
  // reset here so coming back shows an empty form, as in the prototype.
  useEffect(
    () => () => {
      clearTimeout(shakeTimer.current);
      setForm(emptyForm);
      setSent(null);
      setShake(false);
    },
    [],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isContactFormComplete(form)) {
      setShake(true);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
      return;
    }
    setSent(form.name.trim());
  };

  const reset = () => {
    setSent(null);
    setForm(emptyForm);
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
      {!sent ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input id="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input id="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea id="contact-msg" rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
          </div>
          <button className="btn xl press" type="submit" style={{ width: "100%" }}>▶  ENVIAR MENSAJE</button>
        </>
      ) : (
        <TerminalSuccess name={sent} onReset={reset} />
      )}
    </form>
  );
}
