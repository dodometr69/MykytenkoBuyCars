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

const validateLead = ({ name, phone }) => {
  if (!name || !phone) {
    return "Required fields are missing";
  }

  if (name.length > 120 || phone.length > 60) {
    return "Fields are too long";
  }

  if (phone.replace(/\D/g, "").length < 8) {
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
  const website = cleanText(body.website);
  const validationError = validateLead(lead);

  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400);
  }

  if (website) {
    return jsonResponse({ ok: true });
  }

  if (!env.MAKE_WEBHOOK_URL) {
    return jsonResponse({ ok: false, error: "Server configuration error" }, 500);
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (env.MAKE_WEBHOOK_API_KEY) {
    headers["x-make-apikey"] = env.MAKE_WEBHOOK_API_KEY;
  }

  let makeResponse;

  try {
    makeResponse = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers,
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
