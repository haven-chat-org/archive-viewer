import type { HavenServerExport, HavenManifest } from "../lib/types.ts";

interface ServerInfoProps {
  server: HavenServerExport | null;
  manifest: HavenManifest | null;
}

export default function ServerInfo({ server, manifest }: ServerInfoProps) {
  if (!server && !manifest) return null;

  const exportDate = manifest
    ? new Date(manifest.exported_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="server-info">
      {server && (
        <>
          <div className="server-info-header">
            <h3>{server.server.name}</h3>
            {server.server.description && (
              <p className="server-description">{server.server.description}</p>
            )}
          </div>

          <div className="server-info-section">
            <h4>Members ({server.members.length})</h4>
            <div className="server-member-list">
              {server.members.slice(0, 50).map((m) => (
                <div key={m.user_id} className="server-member">
                  <span className="server-member-name">
                    {m.display_name || m.username}
                    {m.nickname && <span className="server-member-nick"> ({m.nickname})</span>}
                  </span>
                  {m.roles.length > 0 && (
                    <span className="server-member-roles">{m.roles.length} roles</span>
                  )}
                </div>
              ))}
              {server.members.length > 50 && (
                <div className="server-member-more">
                  +{server.members.length - 50} more members
                </div>
              )}
            </div>
          </div>

          {server.roles.length > 0 && (
            <div className="server-info-section">
              <h4>Roles ({server.roles.length})</h4>
              <div className="server-role-list">
                {server.roles.map((r) => (
                  <span
                    key={r.id}
                    className="server-role-chip"
                    style={{ borderColor: r.color ?? "#99aab5" }}
                  >
                    <span
                      className="server-role-dot"
                      style={{ backgroundColor: r.color ?? "#99aab5" }}
                    />
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {manifest && (
        <div className="server-info-section">
          <h4>Export Info</h4>
          <div className="export-meta-grid">
            <span className="export-meta-label">Exported by</span>
            <span>{manifest.exported_by.username}</span>
            {exportDate && (
              <>
                <span className="export-meta-label">Date</span>
                <span>{exportDate}</span>
              </>
            )}
            <span className="export-meta-label">Messages</span>
            <span>{manifest.message_count.toLocaleString()}</span>
            <span className="export-meta-label">Files</span>
            <span>{Object.keys(manifest.files).length}</span>
            {manifest.instance_url && (
              <>
                <span className="export-meta-label">Instance</span>
                <span>{manifest.instance_url}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
