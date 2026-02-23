import { useRef, useEffect, type ReactNode } from "react";
import type { HavenExportMessage, HavenChannelExport } from "../lib/types.ts";

interface MessageListProps {
  channel: HavenChannelExport;
  highlightMessageId?: string | null;
}

// Stable color from string hash for avatar
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// TipTap JSON to React element tree — no innerHTML needed
interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, string> }[];
  attrs?: Record<string, string>;
}

function renderTipTapToReact(node: TipTapNode, key: number = 0): ReactNode {
  if (node.type === "text") {
    let element: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      switch (mark.type) {
        case "bold": element = <strong key={key}>{element}</strong>; break;
        case "italic": element = <em key={key}>{element}</em>; break;
        case "underline": element = <u key={key}>{element}</u>; break;
        case "strike": element = <s key={key}>{element}</s>; break;
        case "code": element = <code key={key}>{element}</code>; break;
        case "link":
          element = <a key={key} href={mark.attrs?.href ?? "#"} target="_blank" rel="noopener noreferrer">{element}</a>;
          break;
        case "spoiler": element = <span key={key} className="spoiler">{element}</span>; break;
      }
    }
    return element;
  }

  const children = (node.content ?? []).map((child, i) => renderTipTapToReact(child, i));

  switch (node.type) {
    case "doc": return <>{children}</>;
    case "paragraph": return <p key={key}>{children.length > 0 ? children : <br />}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 3);
      if (level === 1) return <h1 key={key}>{children}</h1>;
      if (level === 2) return <h2 key={key}>{children}</h2>;
      if (level === 4) return <h4 key={key}>{children}</h4>;
      return <h3 key={key}>{children}</h3>;
    }
    case "codeBlock": return <pre key={key}><code>{children}</code></pre>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "hardBreak": return <br key={key} />;
    default: return <span key={key}>{children}</span>;
  }
}

function renderMessageContent(msg: HavenExportMessage): ReactNode {
  if (msg.content_type === "tiptap" && msg.formatting) {
    try {
      const doc = JSON.parse(msg.formatting) as TipTapNode;
      return renderTipTapToReact(doc);
    } catch {
      return <p>{msg.text ?? ""}</p>;
    }
  }
  // Plain text: split by newlines for basic formatting
  const text = msg.text ?? "";
  if (!text) return null;
  return text.split("\n").map((line, i) => (
    <p key={i}>{line || <br />}</p>
  ));
}

function MessageRow({ msg, allMessages }: { msg: HavenExportMessage; allMessages: HavenExportMessage[] }) {
  const isSystem = msg.type !== "user";
  const displayName = msg.sender_display_name || msg.sender_name;
  const initial = displayName.charAt(0).toUpperCase();
  const avatarColor = hashColor(msg.sender_id);

  if (isSystem) {
    return (
      <div className="message-row message-system" id={`msg-${msg.id}`}>
        <span className="system-text">{msg.text ?? `[${msg.type}]`}</span>
        <span className="system-time">{formatTime(msg.timestamp)}</span>
      </div>
    );
  }

  // Find reply target
  let replyPreview: string | null = null;
  let replySender: string | null = null;
  if (msg.reply_to) {
    const target = allMessages.find((m) => m.id === msg.reply_to);
    if (target) {
      replyPreview = (target.text ?? "").slice(0, 100);
      replySender = target.sender_display_name || target.sender_name;
    }
  }

  return (
    <div className={`message-row ${msg.pinned ? "message-pinned" : ""}`} id={`msg-${msg.id}`}>
      {msg.reply_to && (
        <div className="message-reply-bar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="reply-icon">
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
          </svg>
          <span className="reply-sender">{replySender ?? "Unknown"}</span>
          <span className="reply-text">{replyPreview ?? "[message not found]"}</span>
        </div>
      )}
      <div className="message-body">
        <div className="message-avatar" style={{ backgroundColor: avatarColor }}>
          {initial}
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender" style={{ color: avatarColor }}>{displayName}</span>
            <span className="message-time">{formatTime(msg.timestamp)}</span>
            {msg.edited && <span className="message-edited">(edited)</span>}
            {msg.pinned && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="pin-icon" aria-label="Pinned">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
          </div>
          <div className="message-text">
            {renderMessageContent(msg)}
          </div>
          {msg.attachments.length > 0 && (
            <div className="message-attachments">
              {msg.attachments.map((att) => {
                const isImage = att.mime_type.startsWith("image/");
                return (
                  <div key={att.id} className="attachment-card">
                    {isImage && (
                      <div className="attachment-image-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        {att.width && att.height && (
                          <span className="attachment-dimensions">{att.width}x{att.height}</span>
                        )}
                      </div>
                    )}
                    <div className="attachment-info">
                      <span className="attachment-filename">{att.filename}</span>
                      <span className="attachment-size">{formatFileSize(att.size)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {msg.reactions.length > 0 && (
            <div className="message-reactions">
              {msg.reactions.map((r, i) => (
                <span key={i} className="reaction-chip">
                  <span className="reaction-emoji">{r.emoji}</span>
                  <span className="reaction-count">{r.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageList({ channel, highlightMessageId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted message when it changes
  useEffect(() => {
    if (highlightMessageId && containerRef.current) {
      const el = containerRef.current.querySelector(`#msg-${CSS.escape(highlightMessageId)}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("message-highlight");
        const timer = setTimeout(() => el.classList.remove("message-highlight"), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightMessageId]);

  return (
    <div className="message-list" ref={containerRef}>
      <div className="message-list-header">
        <h2>#{channel.channel.name}</h2>
        <span className="message-list-meta">
          {channel.message_count} messages
          {channel.date_range && ` \u00B7 ${new Date(channel.date_range.from).toLocaleDateString()} \u2013 ${new Date(channel.date_range.to).toLocaleDateString()}`}
        </span>
      </div>
      <div className="message-list-content">
        {channel.messages.map((msg) => (
          <MessageRow key={msg.id} msg={msg} allMessages={channel.messages} />
        ))}
        {channel.messages.length === 0 && (
          <div className="message-list-empty">No messages in this export.</div>
        )}
      </div>
    </div>
  );
}
