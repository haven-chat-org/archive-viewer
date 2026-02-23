// Local type definitions mirroring haven-core export types.
// We duplicate them here so archive-viewer has zero dependency on haven-core
// and can be deployed as a fully standalone offline app.

export interface HavenManifest {
  version: number;
  format: "haven-export";
  exported_by: {
    user_id: string;
    username: string;
    identity_key: string;
  };
  exported_at: string;
  server_id?: string;
  channel_id?: string;
  instance_url: string;
  files: Record<string, { sha256: string; size: number }>;
  message_count: number;
  date_range: { from: string; to: string };
  user_signature?: string;
  server_signature?: string;
}

export interface HavenChannelExport {
  channel: {
    id: string;
    name: string;
    type: string;
    encrypted: boolean;
    category?: string;
    created_at: string;
  };
  exported_at: string;
  exported_by: string;
  message_count: number;
  date_range: { from: string; to: string };
  messages: HavenExportMessage[];
}

export interface HavenExportMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_display_name: string | null;
  timestamp: string;
  text: string | null;
  content_type: string;
  formatting: string | null;
  edited: boolean;
  reply_to: string | null;
  type: string;
  reactions: { emoji: string; count: number; users: string[] }[];
  pinned: boolean;
  attachments: HavenAttachmentRef[];
}

export interface HavenAttachmentRef {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  file_ref: string;
}

export interface HavenServerExport {
  server: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    created_at: string;
  };
  categories: {
    id: string;
    name: string;
    position: number;
  }[];
  channels: {
    id: string;
    name: string;
    type: string;
    category_id: string | null;
    position: number;
    encrypted: boolean;
    is_private: boolean;
  }[];
  roles: {
    id: string;
    name: string;
    color: string | null;
    permissions: number;
    position: number;
    is_default: boolean;
  }[];
  members: {
    user_id: string;
    username: string;
    display_name: string | null;
    nickname: string | null;
    roles: string[];
    joined_at: string;
  }[];
  emojis: {
    id: string;
    name: string;
    image_ref?: string;
  }[];
  permission_overwrites: {
    channel_id: string;
    target_type: string;
    target_id: string;
    allow: number;
    deny: number;
  }[];
}

/** Parsed archive — the result of opening a .haven or .json file. */
export interface ParsedArchive {
  manifest: HavenManifest | null;
  channels: HavenChannelExport[];
  server: HavenServerExport | null;
  auditLog: unknown[] | null;
  /** Raw file map from ZIP for hash verification */
  rawFiles: Map<string, Uint8Array> | null;
}
