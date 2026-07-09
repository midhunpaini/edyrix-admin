// YouTube helpers for the Add-Video flow.
// Thumbnails derive from the video id and work for unlisted videos; title auto-pull via oEmbed
// only works for public videos (best-effort — unlisted returns nothing, we fall back to manual).

/** Extract the 11-char video id from a pasted URL, or return the input if it already looks like an id. */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // bare id
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      // /embed/ID, /shorts/ID, /v/ID
      const m = url.pathname.match(/\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

export function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** Best-effort title fetch via YouTube oEmbed. Returns null for unlisted/private or on any error. */
export async function fetchOembedTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
}
