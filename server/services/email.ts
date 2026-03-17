import nodemailer from "nodemailer";

// Configuration SMTP Titan
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.titan.email";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "inferencevision@inferencevision.store";
  const pass = process.env.SMTP_PASS;
  const secure = port === 465;

  if (!pass) {
    console.warn("[Email] SMTP_PASS non configuré — les emails ne seront pas envoyés");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

// Template HTML luxe — email de confirmation au candidat
const buildCandidateConfirmationEmail = (data: {
  firstName: string;
  lastName: string;
  brandName: string;
  email: string;
}) => {
  const fullName = `${data.firstName} ${data.lastName}`;
  return {
    subject: `✦ Votre candidature L'Écrin Virtuel a bien été reçue`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidature reçue — L'Écrin Virtuel</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #d4c5b0;">
          
          <!-- En-tête -->
          <tr>
            <td style="background-color:#0a0a0a;padding:40px 48px;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:6px;color:#c9a96e;text-transform:uppercase;font-family:Arial,sans-serif;">L'Écrin Virtuel</p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:400;color:#ffffff;letter-spacing:2px;">✦</h1>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;font-family:Arial,sans-serif;">Candidature partenaire</p>
              <h2 style="margin:0 0 32px;font-size:24px;font-weight:400;color:#1a1a1a;line-height:1.4;">
                Chère / Cher ${fullName},
              </h2>
              <p style="margin:0 0 20px;font-size:16px;color:#3a3a3a;line-height:1.8;">
                Nous avons bien reçu votre candidature pour rejoindre <strong>L'Écrin Virtuel</strong> en tant que créateur partenaire.
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#3a3a3a;line-height:1.8;">
                Votre marque <strong>${data.brandName}</strong> a retenu toute notre attention. Notre équipe va étudier votre dossier avec soin et vous contactera dans les <strong>5 à 7 jours ouvrés</strong>.
              </p>

              <!-- Récapitulatif -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f6f2;border-left:3px solid #c9a96e;margin:32px 0;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;font-size:10px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;font-family:Arial,sans-serif;">Récapitulatif</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#3a3a3a;"><strong>Marque :</strong> ${data.brandName}</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#3a3a3a;"><strong>Contact :</strong> ${fullName}</p>
                    <p style="margin:0;font-size:14px;color:#3a3a3a;"><strong>Email :</strong> ${data.email}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:16px;color:#3a3a3a;line-height:1.8;">
                En attendant, nous vous invitons à découvrir notre application et à explorer les fonctionnalités d'essayage virtuel qui feront briller vos créations.
              </p>
              <p style="margin:0;font-size:16px;color:#3a3a3a;line-height:1.8;">
                Avec toute notre gratitude,<br>
                <em>L'équipe L'Écrin Virtuel</em>
              </p>
            </td>
          </tr>

          <!-- Séparateur -->
          <tr>
            <td style="padding:0 48px;">
              <hr style="border:none;border-top:1px solid #e8e0d5;margin:0;">
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#999;font-family:Arial,sans-serif;line-height:1.6;">
                L'Écrin Virtuel — Bijoux en réalité augmentée<br>
                Propulsé par Inferencevision<br>
                <span style="color:#c9a96e;">✦</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
};

// Template HTML — notification interne à l'équipe
const buildTeamNotificationEmail = (data: {
  firstName: string;
  lastName: string;
  brandName: string;
  email: string;
  phone?: string;
  website?: string;
  instagram?: string;
  description?: string;
  productTypes?: string;
  priceRange?: string;
  submittedAt: string;
}) => {
  return {
    subject: `🔔 Nouvelle candidature partenaire : ${data.brandName}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle candidature — ${data.brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:30px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          
          <!-- En-tête -->
          <tr>
            <td style="background-color:#1a1a2e;padding:28px 36px;">
              <p style="margin:0;font-size:12px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">L'Écrin Virtuel — Notification interne</p>
              <h2 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:600;">
                🔔 Nouvelle candidature partenaire
              </h2>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;">
                Une nouvelle candidature vient d'être soumise via l'application L'Écrin Virtuel.
              </p>

              <!-- Infos candidat -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <tr style="background-color:#f8f8f8;">
                  <td colspan="2" style="padding:12px 16px;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;font-weight:600;">
                    Informations du candidat
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;width:40%;border-top:1px solid #f0f0f0;">Marque</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-top:1px solid #f0f0f0;">${data.brandName}</td>
                </tr>
                <tr style="background-color:#fafafa;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Contact</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;border-top:1px solid #f0f0f0;">${data.firstName} ${data.lastName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Email</td>
                  <td style="padding:10px 16px;font-size:13px;color:#0066cc;border-top:1px solid #f0f0f0;"><a href="mailto:${data.email}" style="color:#0066cc;">${data.email}</a></td>
                </tr>
                ${data.phone ? `<tr style="background-color:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Téléphone</td><td style="padding:10px 16px;font-size:13px;color:#1a1a1a;border-top:1px solid #f0f0f0;">${data.phone}</td></tr>` : ""}
                ${data.website ? `<tr><td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Site web</td><td style="padding:10px 16px;font-size:13px;border-top:1px solid #f0f0f0;"><a href="${data.website}" style="color:#0066cc;">${data.website}</a></td></tr>` : ""}
                ${data.instagram ? `<tr style="background-color:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Instagram</td><td style="padding:10px 16px;font-size:13px;color:#1a1a1a;border-top:1px solid #f0f0f0;">@${data.instagram}</td></tr>` : ""}
                ${data.productTypes ? `<tr><td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Types de produits</td><td style="padding:10px 16px;font-size:13px;color:#1a1a1a;border-top:1px solid #f0f0f0;">${data.productTypes}</td></tr>` : ""}
                ${data.priceRange ? `<tr style="background-color:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#666;border-top:1px solid #f0f0f0;">Gamme de prix</td><td style="padding:10px 16px;font-size:13px;color:#1a1a1a;border-top:1px solid #f0f0f0;">${data.priceRange}</td></tr>` : ""}
              </table>

              ${data.description ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <tr style="background-color:#f8f8f8;">
                  <td style="padding:12px 16px;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;font-weight:600;">Description de la marque</td>
                </tr>
                <tr>
                  <td style="padding:16px;font-size:14px;color:#333;line-height:1.7;border-top:1px solid #f0f0f0;">${data.description}</td>
                </tr>
              </table>` : ""}

              <p style="margin:0;font-size:12px;color:#999;">
                Soumis le ${data.submittedAt}
              </p>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color:#f8f8f8;padding:16px 36px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:11px;color:#aaa;">
                L'Écrin Virtuel — Notification automatique — Ne pas répondre à cet email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
};

// Fonction principale d'envoi d'email après candidature partenaire
export async function sendPartnerApplicationEmails(data: {
  firstName: string;
  lastName: string;
  brandName: string;
  email: string;
  phone?: string;
  website?: string;
  instagram?: string;
  description?: string;
  productTypes?: string;
  priceRange?: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[Email] Transporter non disponible — emails ignorés");
    return { success: false, reason: "SMTP_PASS non configuré" };
  }

  const fromAddress = `"L'Écrin Virtuel" <${process.env.SMTP_USER || "inferencevision@inferencevision.store"}>`;
  const notificationEmail = process.env.SMTP_NOTIFICATION_EMAIL || "inferencevision@inferencevision.store";
  const submittedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const results = { candidate: false, team: false };

  // 1. Email de confirmation au candidat
  try {
    const candidateTemplate = buildCandidateConfirmationEmail(data);
    await transporter.sendMail({
      from: fromAddress,
      to: data.email,
      subject: candidateTemplate.subject,
      html: candidateTemplate.html,
    });
    results.candidate = true;
    console.log(`[Email] Confirmation envoyée à ${data.email}`);
  } catch (err) {
    console.error("[Email] Erreur envoi confirmation candidat:", err);
  }

  // 2. Notification interne à l'équipe
  try {
    const teamTemplate = buildTeamNotificationEmail({ ...data, submittedAt });
    await transporter.sendMail({
      from: fromAddress,
      to: notificationEmail,
      subject: teamTemplate.subject,
      html: teamTemplate.html,
    });
    results.team = true;
    console.log(`[Email] Notification équipe envoyée à ${notificationEmail}`);
  } catch (err) {
    console.error("[Email] Erreur envoi notification équipe:", err);
  }

  return { success: results.candidate || results.team, ...results };
}
