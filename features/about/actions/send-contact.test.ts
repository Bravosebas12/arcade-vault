import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendContact } from "@/features/about/actions/send-contact";

const resend = vi.hoisted(() => ({ send: vi.fn(), keys: [] as string[] }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
    constructor(key: string) {
      resend.keys.push(key);
    }
  },
}));

const ENV_KEYS = ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"] as const;
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const valid = { name: "  px_kai ", email: " jugador@vault.gg ", msg: " ¿Podéis añadir Galaga? " };

const formData = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

const idle = { status: "idle" } as const;

describe("sendContact", () => {
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resend.send.mockReset();
    resend.keys.length = 0;
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.CONTACT_TO_EMAIL = "team@arcade.test";
    delete process.env.CONTACT_FROM_EMAIL;
    logError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    logError.mockRestore();
  });

  it("answers sent without calling Resend when the honeypot is filled", async () => {
    const state = await sendContact(idle, formData({ ...valid, website: "http://spam.example" }));

    expect(state).toEqual({ status: "sent", name: "px_kai" });
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("answers error without calling Resend when the form is invalid", async () => {
    const values = { ...valid, email: "jugador@" };
    const state = await sendContact(idle, formData(values));

    expect(state).toEqual({ status: "error", form: values });
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("answers error and logs only the reason when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const state = await sendContact(idle, formData(valid));

    expect(state).toEqual({ status: "error", form: valid });
    expect(resend.send).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logError.mock.calls)).not.toContain("Galaga");
  });

  it("answers error when CONTACT_TO_EMAIL is missing", async () => {
    process.env.CONTACT_TO_EMAIL = "";
    const state = await sendContact(idle, formData(valid));

    expect(state).toEqual({ status: "error", form: valid });
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("answers error and logs only the error name and message when Resend returns an error", async () => {
    resend.send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "Invalid `to` field." } });
    const state = await sendContact(idle, formData(valid));

    expect(state).toEqual({ status: "error", form: valid });
    expect(logError).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(logError.mock.calls);
    expect(logged).toContain("validation_error");
    expect(logged).toContain("Invalid `to` field.");
    expect(logged).not.toContain("Galaga");
    expect(logged).not.toContain("jugador@vault.gg");
  });

  it("answers error when Resend throws", async () => {
    resend.send.mockRejectedValue(new Error("network down"));
    const state = await sendContact(idle, formData(valid));

    expect(state).toEqual({ status: "error", form: valid });
  });

  it("sends the email from the default sender and answers sent with the trimmed name", async () => {
    resend.send.mockResolvedValue({ data: { id: "email_1" }, error: null });
    const state = await sendContact(idle, formData(valid));

    expect(state).toEqual({ status: "sent", name: "px_kai" });
    expect(resend.keys).toEqual(["re_test_key"]);
    expect(resend.send).toHaveBeenCalledWith({
      from: "Arcade Vault <onboarding@resend.dev>",
      to: "team@arcade.test",
      subject: "[Arcade Vault] Mensaje de px_kai",
      text: "Nombre: px_kai\nCorreo: jugador@vault.gg\n\n¿Podéis añadir Galaga?",
      replyTo: "jugador@vault.gg",
    });
  });

  it("uses CONTACT_FROM_EMAIL when set, and the default when it is empty", async () => {
    resend.send.mockResolvedValue({ data: { id: "email_1" }, error: null });

    process.env.CONTACT_FROM_EMAIL = "Vault <hola@arcade.test>";
    await sendContact(idle, formData(valid));
    process.env.CONTACT_FROM_EMAIL = "";
    await sendContact(idle, formData(valid));

    expect(resend.send.mock.calls[0][0].from).toBe("Vault <hola@arcade.test>");
    expect(resend.send.mock.calls[1][0].from).toBe("Arcade Vault <onboarding@resend.dev>");
  });
});
