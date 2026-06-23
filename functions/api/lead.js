const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const validateLead = ({ name, phone, budget }) => {
  if (!name || !phone || !budget) {
    return "Required fields are missing";
  }

  if (name.length > 120 || phone.length > 60 || budget.length > 80) {
    return "Fields are too long";
  }

  const phoneDigits = phone.replace(/\D/g, "");

  if (phoneDigits.length < 8) {
    return "Phone number is invalid";
  }

  return "";
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const body = await readJson(request);

  if (!body) {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
  }

  const lead = {
    name: cleanText(body.name),
    phone: cleanText(body.phone),
    budget: cleanText(body.budget),
  };
  const turnstileToken = cleanText(body.turnstileToken);
  const website = cleanText(body.website);
  const validationError = validateLead(lead);

  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400);
  }

  if (website) {
    return jsonResponse({ ok: true, spam: true });
  }

  if (!turnstileToken || turnstileToken.length > 4096) {
    return jsonResponse({ ok: false, error: "Turnstile verification failed" }, 403);
  }

  if (!env.TURNSTILE_SECRET_KEY || !env.MAKE_WEBHOOK_URL || !env.MAKE_WEBHOOK_API_KEY) {
    return jsonResponse({ ok: false, error: "Server configuration error" }, 500);
  }

  const verificationData = new FormData();
  verificationData.append("secret", env.TURNSTILE_SECRET_KEY);
  verificationData.append("response", turnstileToken);

  const remoteIp = request.headers.get("CF-Connecting-IP");

  if (remoteIp) {
    verificationData.append("remoteip", remoteIp);
  }

  let turnstileResponse;

  try {
    turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verificationData,
    });
  } catch {
    return jsonResponse({ ok: false, error: "Turnstile verification failed" }, 403);
  }

  let turnstileResult;

  try {
    turnstileResult = await turnstileResponse.json();
  } catch {
    return jsonResponse({ ok: false, error: "Turnstile verification failed" }, 403);
  }

  if (!turnstileResponse.ok || !turnstileResult.success) {
    return jsonResponse({ ok: false, error: "Turnstile verification failed" }, 403);
  }

  let makeResponse;

  try {
    makeResponse = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-apikey": env.MAKE_WEBHOOK_API_KEY,
      },
      body: JSON.stringify(lead),
    });
  } catch {
    return jsonResponse({ ok: false, error: "Lead delivery failed" }, 502);
  }

  if (!makeResponse.ok) {
    return jsonResponse({ ok: false, error: "Lead delivery failed" }, 502);
  }

  return jsonResponse({ ok: true });
}
