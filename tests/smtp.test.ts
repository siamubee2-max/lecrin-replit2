import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

describe.skipIf(!hasSmtpCreds)("SMTP Titan configuration", () => {
  it("should connect to smtp.titan.email on port 465 (SSL)", async () => {
    const host = process.env.SMTP_HOST || "smtp.titan.email";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    expect(host).toBe("smtp.titan.email");
    expect(port).toBe(465);
    expect(user).toBeTruthy();
    expect(pass).toBeTruthy();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user: user!, pass: pass! },
      tls: { rejectUnauthorized: false },
    });

    const verified = await transporter.verify();
    expect(verified).toBe(true);
  }, 15000);
});
