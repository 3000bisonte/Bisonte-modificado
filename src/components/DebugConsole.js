"use client";
import { useState, useEffect, useRef } from "react";

export default function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all"); // all, error, warn, info, log
  const logsEndRef = useRef(null);
  const maxLogs = 200;

  useEffect(() => {
    // Interceptar console.log, console.error, console.warn, console.info
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type, args) => {
      const message = args
        .map(arg => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");

      const timestamp = new Date().toLocaleTimeString("es-CO", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3
      });

      setLogs(prevLogs => {
        const newLog = { type, message, timestamp, id: Date.now() + Math.random() };
        const updated = [...prevLogs, newLog];
        // Mantener solo los últimos maxLogs
        return updated.slice(-maxLogs);
      });
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog("log", args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog("error", args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog("warn", args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog("info", args);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  useEffect(() => {
    // Auto-scroll al final cuando se agregan nuevos logs
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const filteredLogs = logs.filter(log => {
    if (filter === "all") return true;
    return log.type === filter;
  });

  const getLogColor = (type) => {
    switch (type) {
      case "error": return "text-red-600";
      case "warn": return "text-yellow-600";
      case "info": return "text-blue-600";
      default: return "text-gray-800";
    }
  };

  const getLogBg = (type) => {
    switch (type) {
      case "error": return "bg-red-50 border-l-4 border-red-500";
      case "warn": return "bg-yellow-50 border-l-4 border-yellow-500";
      case "info": return "bg-blue-50 border-l-4 border-blue-500";
      default: return "bg-gray-50 border-l-4 border-gray-300";
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const text = filteredLogs
      .map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`)
      .join("\n");
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Logs copiados al portapapeles");
      });
    } else {
      alert("Clipboard no disponible");
    }
  };

  const downloadLogs = () => {
    const text = filteredLogs
      .map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`)
      .join("\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Botón flotante para abrir debug console */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-[9999] bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center font-bold text-lg transition-all"
          title="Abrir consola de debug"
        >
          🐛
        </button>
      )}

      {/* Consola de debug */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          {/* Header */}
          <div className="bg-purple-600 text-white p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐛</span>
              <h3 className="font-bold text-lg">Debug Console</h3>
              <span className="text-xs bg-purple-700 px-2 py-1 rounded">
                {filteredLogs.length} logs
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-purple-700 rounded px-3 py-1 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Toolbar */}
          <div className="bg-gray-100 p-2 flex gap-2 flex-wrap border-b border-gray-300">
            {/* Filtros */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 rounded border border-gray-300 text-sm"
            >
              <option value="all">Todos ({logs.length})</option>
              <option value="log">Log ({logs.filter(l => l.type === "log").length})</option>
              <option value="info">Info ({logs.filter(l => l.type === "info").length})</option>
              <option value="warn">Warn ({logs.filter(l => l.type === "warn").length})</option>
              <option value="error">Error ({logs.filter(l => l.type === "error").length})</option>
            </select>

            {/* Botones */}
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={copyLogs}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
            >
              📋 Copiar
            </button>
            <button
              onClick={downloadLogs}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
            >
              💾 Descargar
            </button>
          </div>

          {/* Logs area */}
          <div className="flex-1 overflow-y-auto p-2 bg-white">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-4xl mb-2">📭</p>
                <p>No hay logs para mostrar</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded text-xs ${getLogBg(log.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 text-[10px] font-mono shrink-0">
                        {log.timestamp}
                      </span>
                      <span className={`font-bold uppercase text-[10px] shrink-0 ${getLogColor(log.type)}`}>
                        [{log.type}]
                      </span>
                    </div>
                    <pre className={`mt-1 whitespace-pre-wrap break-words font-mono text-xs ${getLogColor(log.type)}`}>
                      {log.message}
                    </pre>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
