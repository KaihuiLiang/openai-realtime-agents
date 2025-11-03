import React from "react";
import { SessionStatus } from "@/app/types";
import { Mic } from 'lucide-react';

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  voiceModeActive: boolean;
  setVoiceModeActive: (active: boolean) => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  voiceModeActive,
  setVoiceModeActive,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-base p-2 w-36 rounded-md h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-red-600 hover:bg-red-700 ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> black
    return `bg-black hover:bg-gray-900 ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="p-4 flex flex-row items-center justify-center gap-x-8">
      <button
        onClick={onToggleConnection}
        className={getConnectionButtonClasses()}
        disabled={isConnecting}
      >
        {getConnectionButtonLabel()}
      </button>

      <div className="flex flex-row items-center gap-2">
        <input
          id="logs"
          type="checkbox"
          checked={isEventsPaneExpanded}
          onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer">
          Logs
        </label>
      </div>

      <button
        onClick={() => setVoiceModeActive(true)}
        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${voiceModeActive
            ? 'bg-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={!isConnected}
        title="Enter Voice Mode (full screen)"
      >
        <Mic size={18} />
        <span>Voice Mode</span>
      </button>
    </div>
  );
}

export default BottomToolbar;
