// Deploy as a web app under the Gmail account that will receive inquiries.
const OWNER_EMAIL = "abasphai2053@gmail.com";

function doPost(event) {
  try {
    const secret = PropertiesService.getScriptProperties().getProperty("PORTFOLIO_MAIL_SECRET");
    const payload = JSON.parse(event.postData.contents);
    if (!secret || secret.length < 32 || !matchesSecret(payload.secret, secret)) {
      return jsonResult(false);
    }

    const { name, email, service, message } = payload;
    if (typeof name !== "string" || !name || name.length > 100 ||
        typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof message !== "string" || !message || message.length > 2000 ||
        !["IT or programming training", "Website design and development"].includes(service)) {
      return jsonResult(false);
    }

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      replyTo: email,
      subject: "New portfolio inquiry: " + service,
      body: "Name: " + name + "\nEmail: " + email + "\nService: " + service + "\n\n" + message,
    });
    return jsonResult(true);
  } catch {
    return jsonResult(false);
  }
}

function matchesSecret(value, secret) {
  if (typeof value !== "string" || value.length !== secret.length) return false;
  let difference = 0;
  for (let i = 0; i < secret.length; i++) difference |= value.charCodeAt(i) ^ secret.charCodeAt(i);
  return difference === 0;
}

function jsonResult(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok })).setMimeType(ContentService.MimeType.JSON);
}
