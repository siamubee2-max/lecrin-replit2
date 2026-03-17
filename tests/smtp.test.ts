import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP Titan configuration", () => {
  it("should connect to smtp.titan.email on port 465 (SSL)", async () => {
    const host = process.env.SMTP_HOST || "smtp.titan.email";
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    expect(host).toBe("smtp.titan.email");
    expect(port).toBe(465);
    expect(user).toBe("inferencevision@inferencevision.store");
    expect(pass).toBeTruthy();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    // Vérifier la connexion SMTP
    const verified = await transporter.verify();
    expect(verified).toBe(true);
  }, 15000);
});
