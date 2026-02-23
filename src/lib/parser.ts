import { unzipSync } from "fflate";
import type {
  ParsedArchive,
  HavenManifest,
  HavenChannelExport,
  HavenServerExport,
} from "./types.ts";

const decoder = new TextDecoder();

function parseJson<T>(data: Uint8Array): T {
  return JSON.parse(decoder.decode(data)) as T;
}

function isZip(data: ArrayBuffer): boolean {
  const view = new Uint8Array(data);
  // ZIP magic bytes: PK\x03\x04
  return view.length >= 4 && view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04;
}

export function parseHavenArchive(data: ArrayBuffer): ParsedArchive {
  if (isZip(data)) {
    return parseZipArchive(data);
  }
  return parseJsonArchive(data);
}

function parseZipArchive(data: ArrayBuffer): ParsedArchive {
  const files = unzipSync(new Uint8Array(data));
  const rawFiles = new Map<string, Uint8Array>();

  for (const [path, content] of Object.entries(files)) {
    rawFiles.set(path, content);
  }

  // Parse manifest
  let manifest: HavenManifest | null = null;
  const manifestData = rawFiles.get("manifest.json");
  if (manifestData) {
    manifest = parseJson<HavenManifest>(manifestData);
  }

  // Parse channels — look in channels/ and dms/ directories
  const channels: HavenChannelExport[] = [];
  for (const [path, content] of rawFiles) {
    if ((path.startsWith("channels/") || path.startsWith("dms/")) && path.endsWith(".json")) {
      try {
        channels.push(parseJson<HavenChannelExport>(content));
      } catch {
        // Skip malformed channel files
      }
    }
  }

  // Parse server metadata
  let server: HavenServerExport | null = null;
  const serverData = rawFiles.get("server.json");
  if (serverData) {
    try {
      server = parseJson<HavenServerExport>(serverData);
    } catch {
      // Skip malformed server file
    }
  }

  // Parse audit log
  let auditLog: unknown[] | null = null;
  const auditData = rawFiles.get("audit-log.json");
  if (auditData) {
    try {
      auditLog = parseJson<unknown[]>(auditData);
    } catch {
      // Skip malformed audit log
    }
  }

  return { manifest, channels, server, auditLog, rawFiles };
}

function parseJsonArchive(data: ArrayBuffer): ParsedArchive {
  const text = decoder.decode(new Uint8Array(data));
  const parsed = JSON.parse(text) as Record<string, unknown>;

  // Could be a single channel export or a multi-channel export with { channels: [...] }
  if ("channel" in parsed && "messages" in parsed) {
    // Single channel export
    return {
      manifest: null,
      channels: [parsed as unknown as HavenChannelExport],
      server: null,
      auditLog: null,
      rawFiles: null,
    };
  }

  if ("channels" in parsed && Array.isArray(parsed.channels)) {
    return {
      manifest: null,
      channels: parsed.channels as HavenChannelExport[],
      server: null,
      auditLog: null,
      rawFiles: null,
    };
  }

  // Unknown format — return empty
  return {
    manifest: null,
    channels: [],
    server: null,
    auditLog: null,
    rawFiles: null,
  };
}
