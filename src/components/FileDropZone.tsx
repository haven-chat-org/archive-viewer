import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  onFileLoaded: (data: ArrayBuffer, filename: string) => void;
}

export default function FileDropZone({ onFileLoaded }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith(".haven") && !name.endsWith(".json")) {
      setError("Unsupported file type. Please use a .haven or .json file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        onFileLoaded(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsArrayBuffer(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`drop-zone ${isDragging ? "drop-zone-active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".haven,.json"
        onChange={handleInputChange}
        className="drop-zone-input"
      />
      <div className="drop-zone-content">
        <svg className="drop-zone-icon" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-7v4h-2v-4H9.5L12 9.5l2.5 3.5H13z" />
        </svg>
        <h2 className="drop-zone-title">Drop your .haven file here</h2>
        <p className="drop-zone-subtitle">or click to browse</p>
        <p className="drop-zone-formats">Supports .haven archives and .json exports</p>
        {error && <p className="drop-zone-error">{error}</p>}
      </div>
    </div>
  );
}
