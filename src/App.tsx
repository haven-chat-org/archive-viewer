import { useState, useCallback } from "react";
import FileDropZone from "./components/FileDropZone.tsx";
import ChannelList from "./components/ChannelList.tsx";
import MessageList from "./components/MessageList.tsx";
import SearchBar from "./components/SearchBar.tsx";
import ServerInfo from "./components/ServerInfo.tsx";
import VerificationBanner from "./components/VerificationBanner.tsx";
import { parseHavenArchive } from "./lib/parser.ts";
import type { ParsedArchive } from "./lib/types.ts";

type SidebarTab = "channels" | "info";

export default function App() {
  const [archive, setArchive] = useState<ParsedArchive | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("channels");

  const handleFileLoaded = useCallback((data: ArrayBuffer, name: string) => {
    try {
      setParseError(null);
      const parsed = parseHavenArchive(data);
      setArchive(parsed);
      setFilename(name);
      // Auto-select first channel
      if (parsed.channels.length > 0) {
        setSelectedChannelId(parsed.channels[0].channel.id);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse archive");
    }
  }, []);

  const handleSearchResult = useCallback((channelId: string, messageId: string) => {
    setSelectedChannelId(channelId);
    setHighlightMessageId(messageId);
    // Clear highlight after a delay to allow re-triggering
    setTimeout(() => setHighlightMessageId(null), 3000);
  }, []);

  const handleClose = useCallback(() => {
    setArchive(null);
    setFilename("");
    setSelectedChannelId(null);
    setHighlightMessageId(null);
    setParseError(null);
  }, []);

  if (!archive) {
    return (
      <div className="app-container app-landing">
        <h1 className="app-title">Haven Archive Viewer</h1>
        <p className="app-subtitle">Open .haven export files offline in your browser</p>
        <FileDropZone onFileLoaded={handleFileLoaded} />
        {parseError && <div className="parse-error">{parseError}</div>}
      </div>
    );
  }

  const selectedChannel = archive.channels.find((c) => c.channel.id === selectedChannelId);

  return (
    <div className="app-container app-viewer">
      {/* Top bar */}
      <header className="viewer-header">
        <div className="viewer-header-left">
          <button className="viewer-close" onClick={handleClose} title="Close archive">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
          <span className="viewer-filename">{filename}</span>
        </div>
        <SearchBar channels={archive.channels} onResultClick={handleSearchResult} />
      </header>

      {/* Verification banner */}
      {archive.manifest && (
        <VerificationBanner manifest={archive.manifest} rawFiles={archive.rawFiles} />
      )}

      {/* Main content */}
      <div className="viewer-body">
        {/* Sidebar */}
        <aside className="viewer-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === "channels" ? "sidebar-tab-active" : ""}`}
              onClick={() => setSidebarTab("channels")}
            >
              Channels
            </button>
            {(archive.server || archive.manifest) && (
              <button
                className={`sidebar-tab ${sidebarTab === "info" ? "sidebar-tab-active" : ""}`}
                onClick={() => setSidebarTab("info")}
              >
                Info
              </button>
            )}
          </div>
          {sidebarTab === "channels" ? (
            <ChannelList
              channels={archive.channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
            />
          ) : (
            <ServerInfo server={archive.server} manifest={archive.manifest} />
          )}
        </aside>

        {/* Message area */}
        <main className="viewer-main">
          {selectedChannel ? (
            <MessageList
              channel={selectedChannel}
              highlightMessageId={highlightMessageId}
            />
          ) : (
            <div className="viewer-no-channel">
              <p>Select a channel to view messages</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
