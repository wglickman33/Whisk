export type QrTemplate = "text" | "url" | "email" | "phone" | "wifi";

export type QrErrorLevel = "L" | "M" | "Q" | "H";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export interface QrWifiFields {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden?: boolean;
}

export interface QrBuildInput {
  template: QrTemplate;
  text: string;
  email?: string;
  phone?: string;
  wifi?: QrWifiFields;
}

export interface QrBuildResult {
  ok: boolean;
  payload?: string;
  error?: string;
}

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(wifi: QrWifiFields): QrBuildResult {
  const ssid = wifi.ssid.trim();
  if (!ssid) return { ok: false, error: "Wi-Fi network name is required." };

  const enc = wifi.encryption;
  const password =
    enc === "nopass" ? "" : wifi.password;

  if (enc !== "nopass" && !password.trim()) {
    return { ok: false, error: "Wi-Fi password is required for secured networks." };
  }

  const hidden = wifi.hidden ? "H:true;" : "";
  const payload = `WIFI:T:${enc};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};${hidden};`;

  return { ok: true, payload };
}

export function buildQrPayload(input: QrBuildInput): QrBuildResult {
  switch (input.template) {
    case "text": {
      const text = input.text.trim();
      if (!text) return { ok: false, error: "Enter text for the QR code." };
      return { ok: true, payload: text };
    }
    case "url": {
      const raw = input.text.trim();
      if (!raw) return { ok: false, error: "Enter a URL." };
      const payload = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      try {
        new URL(payload);
      } catch {
        return { ok: false, error: "Enter a valid URL." };
      }
      return { ok: true, payload };
    }
    case "email": {
      const email = (input.email ?? input.text).trim();
      if (!email) return { ok: false, error: "Enter an email address." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      return { ok: true, payload: `mailto:${email}` };
    }
    case "phone": {
      const phone = (input.phone ?? input.text).trim().replace(/\s/g, "");
      if (!phone) return { ok: false, error: "Enter a phone number." };
      if (!/^\+?[\d()-]{7,20}$/.test(phone)) {
        return { ok: false, error: "Enter a valid phone number." };
      }
      return { ok: true, payload: `tel:${phone}` };
    }
    case "wifi": {
      if (!input.wifi) return { ok: false, error: "Fill in Wi-Fi details." };
      return buildWifiPayload(input.wifi);
    }
    default:
      return { ok: false, error: "Unknown QR template." };
  }
}

export const QR_TEMPLATE_LABELS: Record<QrTemplate, string> = {
  text: "Plain text",
  url: "Website link",
  email: "Email",
  phone: "Phone",
  wifi: "Wi-Fi",
};

export const QR_ERROR_LABELS: Record<QrErrorLevel, string> = {
  L: "Low (smallest)",
  M: "Medium",
  Q: "Quartile",
  H: "High (most durable)",
};
