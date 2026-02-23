import { useState, useEffect } from "react";
import type { HavenManifest } from "../lib/types.ts";

interface VerificationBannerProps {
  manifest: HavenManifest;
  rawFiles: Map<string, Uint8Array> | null;
}

type VerifyStatus = "checking" | "verified" | "modified" | "unsigned";

async function computeSha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data as ArrayBufferView<ArrayBuffer>);
  const arr = new Uint8Array(hash);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function VerificationBanner({ manifest, rawFiles }: VerificationBannerProps) {
  const [status, setStatus] = useState<VerifyStatus>("checking");
  const [filesChecked, setFilesChecked] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [mismatchedFiles, setMismatchedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!rawFiles) {
      // JSON-only export — no file hashes to check
      setStatus("unsigned");
      return;
    }

    if (!manifest.user_signature && Object.keys(manifest.files).length === 0) {
      setStatus("unsigned");
      return;
    }

    let cancelled = false;

    async function verifyHashes() {
      const fileEntries = Object.entries(manifest.files);
      setTotalFiles(fileEntries.length);
      const mismatched: string[] = [];
      let checked = 0;

      for (const [path, expected] of fileEntries) {
        if (cancelled) return;
        const fileData = rawFiles!.get(path);
        if (!fileData) {
          mismatched.push(path);
          checked++;
          setFilesChecked(checked);
          continue;
        }

        const hash = await computeSha256(fileData);
        if (hash !== expected.sha256) {
          mismatched.push(path);
        }
        checked++;
        setFilesChecked(checked);
      }

      if (cancelled) return;
      setMismatchedFiles(mismatched);
      setStatus(mismatched.length > 0 ? "modified" : "verified");
    }

    verifyHashes();
    return () => { cancelled = true; };
  }, [manifest, rawFiles]);

  const exportDate = new Date(manifest.exported_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (status === "checking") {
    return (
      <div className="verification-banner verification-checking">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="verification-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <span>Verifying archive integrity... ({filesChecked}/{totalFiles} files)</span>
      </div>
    );
  }

  if (status === "unsigned") {
    return (
      <div className="verification-banner verification-unsigned">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="verification-icon">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        <div className="verification-details">
          <span className="verification-title">Unsigned export</span>
          <span className="verification-subtitle">Authenticity cannot be verified</span>
        </div>
      </div>
    );
  }

  if (status === "modified") {
    return (
      <div className="verification-banner verification-modified">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="verification-icon">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
        </svg>
        <div className="verification-details">
          <span className="verification-title">Warning: archive has been modified</span>
          <span className="verification-subtitle">
            {mismatchedFiles.length} file{mismatchedFiles.length !== 1 ? "s" : ""} failed integrity check
          </span>
        </div>
      </div>
    );
  }

  // status === "verified"
  return (
    <div className="verification-banner verification-verified">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="verification-icon">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      <div className="verification-details">
        <span className="verification-title">
          {manifest.user_signature
            ? `Verified export by ${manifest.exported_by.username}`
            : `Integrity verified \u2014 exported by ${manifest.exported_by.username}`
          }
        </span>
        <span className="verification-subtitle">
          {exportDate} \u00B7 {filesChecked}/{totalFiles} files verified
          {manifest.user_signature && (
            <> \u00B7 Signature present (online verification required via {manifest.instance_url})</>
          )}
        </span>
      </div>
    </div>
  );
}
