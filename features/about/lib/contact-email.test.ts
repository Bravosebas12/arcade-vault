import { describe, expect, it } from "vitest";
import { buildContactEmail } from "@/features/about/lib/contact-email";

describe("buildContactEmail", () => {
  it("builds the subject, reply-to and plain-text body from the trimmed form", () => {
    const email = buildContactEmail({
      name: "  px_kai ",
      email: " jugador@vault.gg ",
      msg: "\n¿Podéis añadir Galaga?\nGracias.  ",
    });

    expect(email).toEqual({
      subject: "[Arcade Vault] Mensaje de px_kai",
      replyTo: "jugador@vault.gg",
      text: "Nombre: px_kai\nCorreo: jugador@vault.gg\n\n¿Podéis añadir Galaga?\nGracias.",
    });
  });
});
