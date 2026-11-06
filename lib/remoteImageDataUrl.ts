import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_IMAGE_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 8_000;
const IMAGE_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (/^(fc|fd|fe[89ab])/.test(normalized)) return true;

  const mappedIpv4 = normalized.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

function isPrivateAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

async function assertPublicImageUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported image URL protocol.");
  if (url.username || url.password) throw new Error("Image URL credentials are not allowed.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Nonstandard image URL ports are not allowed.");

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Private image hosts are not allowed.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Private image hosts are not allowed.");
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private image hosts are not allowed.");
  }
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) throw new Error("Image exceeds the export size limit.");
  if (!response.body) throw new Error("Image response has no body.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("Image exceeds the export size limit.");
    }
    chunks.push(value);
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function getImageMimeType(bytes: Uint8Array, responseType: string, imageUrl: string) {
  const contentType = responseType.split(";")[0].trim().toLowerCase();
  if (contentType.startsWith("image/")) return contentType;

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";

  const prefix = new TextDecoder().decode(bytes.subarray(0, 512)).trimStart().toLowerCase();
  if (prefix.startsWith("<svg") || (prefix.startsWith("<?xml") && prefix.includes("<svg"))) return "image/svg+xml";

  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".ico")) return "image/x-icon";
  if (pathname.endsWith(".avif")) return "image/avif";
  return "";
}

export async function remoteImageToDataUrl(imageUrl: string, refererUrl?: string) {
  if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;

  let currentUrl = new URL(imageUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicImageUrl(currentUrl);
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": IMAGE_FETCH_USER_AGENT,
        ...(refererUrl ? { referer: refererUrl } : {}),
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("Image redirect limit exceeded.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) throw new Error(`Image request failed with status ${response.status}.`);
    const data = await readLimitedBody(response);
    const contentType = getImageMimeType(data, response.headers.get("content-type") ?? "", currentUrl.toString());
    if (!contentType) throw new Error("Image URL did not return a supported image.");
    return `data:${contentType};base64,${Buffer.from(data).toString("base64")}`;
  }

  throw new Error("Could not resolve image URL.");
}
