import type { HavenChannelExport } from "../lib/types.ts";

interface ChannelListProps {
  channels: HavenChannelExport[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

export default function ChannelList({ channels, selectedChannelId, onSelectChannel }: ChannelListProps) {
  // Group channels by category
  const byCategory = new Map<string, HavenChannelExport[]>();
  const uncategorized: HavenChannelExport[] = [];

  for (const ch of channels) {
    const cat = ch.channel.category ?? "";
    if (cat) {
      const list = byCategory.get(cat) ?? [];
      list.push(ch);
      byCategory.set(cat, list);
    } else {
      uncategorized.push(ch);
    }
  }

  const channelIcon = (type: string) => {
    if (type === "dm" || type === "group") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="channel-icon">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="channel-icon">
        <path d="M5.41 21L6.12 17H2.12L2.47 15H6.47L7.53 9H3.53L3.88 7H7.88L8.59 3H10.59L9.88 7H15.88L16.59 3H18.59L17.88 7H21.88L21.53 9H17.53L16.47 15H20.47L20.12 17H16.12L15.41 21H13.41L14.12 17H8.12L7.41 21H5.41ZM9.47 9L8.47 15H14.47L15.47 9H9.47Z" />
      </svg>
    );
  };

  return (
    <div className="channel-list">
      <div className="channel-list-header">Channels</div>

      {uncategorized.map((ch) => (
        <button
          key={ch.channel.id}
          className={`channel-item ${selectedChannelId === ch.channel.id ? "channel-item-active" : ""}`}
          onClick={() => onSelectChannel(ch.channel.id)}
        >
          {channelIcon(ch.channel.type)}
          <span className="channel-name">{ch.channel.name}</span>
          <span className="channel-count">{ch.message_count}</span>
        </button>
      ))}

      {[...byCategory.entries()].map(([category, chs]) => (
        <div key={category} className="channel-category">
          <div className="channel-category-name">{category}</div>
          {chs.map((ch) => (
            <button
              key={ch.channel.id}
              className={`channel-item ${selectedChannelId === ch.channel.id ? "channel-item-active" : ""}`}
              onClick={() => onSelectChannel(ch.channel.id)}
            >
              {channelIcon(ch.channel.type)}
              <span className="channel-name">{ch.channel.name}</span>
              <span className="channel-count">{ch.message_count}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
