const services = {
  training: "IT or programming training",
  website: "Website design and development",
};

const ownerEmail = "abasphai2053@gmail.com";

function escapeHtml(value) {
  const characters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, character => characters[character]);
}

function page(title, content, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/style.css"><title>${title}</title></head>
    <body><main class="container section resume"><h1>${title}</h1>${content}
    <p><a class="button button-primary" href="/#contact">Back to the portfolio</a></p>
    </main></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function field(form, key) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function submit(request, env, url) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return page("Request blocked", "<p>Please submit the form from the portfolio page.</p>", 403);
  }

  if (!request.headers.get("Content-Type")?.startsWith("application/x-www-form-urlencoded")) {
    return page("Invalid form", "<p>Please submit the form from the portfolio page.</p>", 415);
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32000) {
        await reader.cancel();
        return page("Message is too long", "<p>Keep your message under 2,000 characters.</p>", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  }

  const form = new URLSearchParams(body);
  const name = field(form, "name");
  const email = field(form, "email");
  const service = field(form, "service");
  const message = field(form, "message");

  if (!name || name.length > 100 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !Object.hasOwn(services, service) || !message || message.length > 2000) {
    return page("Check your inquiry", "<p>Enter your name, a valid email address, a service, and a message.</p>", 400);
  }

  try {
    await env.DB.prepare("INSERT INTO inquiries (name, email, service, message) VALUES (?, ?, ?, ?)")
      .bind(name, email, service, message).run();
  } catch {
    return page("Inquiry could not be saved", '<p>Try again or email <a href="mailto:abasphai2053@gmail.com">abasphai2053@gmail.com</a>.</p>', 503);
  }
  return new Response(null, { status: 303, headers: { Location: "/inquiry-sent", "Cache-Control": "no-store" } });
}

async function inbox(request, env) {
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  if (!userId) {
    return page("Inbox access required", '<p><a href="/signin-with-chatgpt?return_to=%2Finbox">Sign in to ChatGPT</a> with the portfolio owner account.</p>', 403);
  }
  if (email !== ownerEmail) {
    return page("Inbox access required", "<p>This inbox is available to the portfolio owner.</p>", 403);
  }

  const { results } = await env.DB.prepare(
    "SELECT name, email, service, message, created_at FROM inquiries ORDER BY id DESC LIMIT 100"
  ).all();
  const rows = results.map(row => `<article class="resume-entry">
    <p class="date">${escapeHtml(row.created_at)} UTC · ${escapeHtml(services[row.service])}</p>
    <h2 class="inbox-name">${escapeHtml(row.name)}</h2>
    <p>${escapeHtml(row.email)}</p><p class="inbox-message">${escapeHtml(row.message)}</p>
  </article>`).join("");
  return page("Portfolio inquiries", rows || "<p>No inquiries yet.</p>");
}

export function createWorker(assets) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (request.method === "POST" && url.pathname === "/inquiries") return submit(request, env, url);
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      if (url.pathname === "/inquiry-sent") {
        return page("Thank you.", "<p>Your inquiry was saved. I’ll reply using the email address you provided.</p>");
      }
      if (url.pathname === "/inbox") return inbox(request, env);

      const asset = assets[url.pathname === "/" ? "/index.html" : url.pathname];
      if (!asset || !Object.hasOwn(assets, url.pathname === "/" ? "/index.html" : url.pathname)) {
        return new Response("Page not found", { status: 404 });
      }
      const [type, base64] = asset;
      const body = request.method === "HEAD" ? null : Uint8Array.from(atob(base64), character => character.charCodeAt(0));
      return new Response(body, { headers: { "Content-Type": type, "X-Content-Type-Options": "nosniff" } });
    },
  };
}
