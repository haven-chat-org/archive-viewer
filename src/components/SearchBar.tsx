import { useState, useMemo, useCallback } from "react";
import type { HavenChannelExport } from "../lib/types.ts";

interface SearchResult {
  channelId: string;
  channelName: string;
  messageId: string;
  senderName: string;
  snippet: string;
  timestamp: string;
}

interface SearchBarProps {
  channels: HavenChannelExport[];
  onResultClick: (channelId: string, messageId: string) => void;
}

export default function SearchBar({ channels, onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const found: SearchResult[] = [];
    for (const ch of channels) {
      for (const msg of ch.messages) {
        if (msg.text && msg.text.toLowerCase().includes(q)) {
          const idx = msg.text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(msg.text.length, idx + q.length + 30);
          const snippet =
            (start > 0 ? "\u2026" : "") +
            msg.text.slice(start, end) +
            (end < msg.text.length ? "\u2026" : "");

          found.push({
            channelId: ch.channel.id,
            channelName: ch.channel.name,
            messageId: msg.id,
            senderName: msg.sender_display_name || msg.sender_name,
            snippet,
            timestamp: msg.timestamp,
          });

          if (found.length >= 50) break;
        }
      }
      if (found.length >= 50) break;
    }
    return found;
  }, [query, channels]);

  const handleResultClick = useCallback((r: SearchResult) => {
    onResultClick(r.channelId, r.messageId);
    setIsOpen(false);
  }, [onResultClick]);

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="search-icon">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(""); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-no-results">No messages found.</div>
          ) : (
            <>
              <div className="search-result-count">{results.length}{results.length >= 50 ? "+" : ""} results</div>
              {results.map((r) => (
                <button
                  key={r.messageId}
                  className="search-result-item"
                  onClick={() => handleResultClick(r)}
                >
                  <div className="search-result-header">
                    <span className="search-result-channel">#{r.channelName}</span>
                    <span className="search-result-sender">{r.senderName}</span>
                    <span className="search-result-time">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="search-result-snippet">{r.snippet}</div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
