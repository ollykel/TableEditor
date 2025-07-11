import React, { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080/ws";

// Define the types for incoming and outgoing messages
type InitMessage = { type: "init"; text: string };
type CreateMessage = { type: "create"; index: number; text: string };
type DeleteMessage = { type: "delete"; start: number; end: number };
type ReplaceMessage = { type: "replace"; start: number; end: number; text: string };

type IncomingMessage = InitMessage | CreateMessage | DeleteMessage | ReplaceMessage;

type OutgoingMessage = CreateMessage | DeleteMessage | ReplaceMessage;

export default function TextEditor(): JSX.Element {
  const [text, setText] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const textRef = useRef<string>(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event: MessageEvent) => {
      const msg: IncomingMessage = JSON.parse(event.data);
      const currentText = textRef.current;

      switch (msg.type) {
        case "init":
          setText(msg.text);
          break;

        case "create":
          {
            const before = currentText.slice(0, msg.index);
            const after = currentText.slice(msg.index);
            setText(before + msg.text + after);
          }
          break;

        case "delete":
          {
            const before = currentText.slice(0, msg.start);
            const after = currentText.slice(msg.end);
            setText(before + after);
          }
          break;

        case "replace":
          {
            const before = currentText.slice(0, msg.start);
            const after = currentText.slice(msg.end);
            setText(before + msg.text + after);
          }
          break;
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!connected) return;

    const newText = e.target.value;
    const oldText = textRef.current;

    const diff = computeDiff(oldText, newText);
    if (!diff) return;

    const { type, payload } = diff;

    const message: OutgoingMessage = { type, ...payload } as OutgoingMessage;
    socketRef.current?.send(JSON.stringify(message));

    setText(newText);
  };

  return (
    <div>
      <textarea
        rows={20}
        cols={100}
        value={text}
        onChange={handleChange}
        disabled={!connected}
        style={{ fontFamily: "monospace", width: "100%" }}
      />
      {!connected && <p style={{ color: "red" }}>Disconnected</p>}
    </div>
  );
}

// === Simple diffing function for small edits ===
function computeDiff(
  oldText: string,
  newText: string
): { type: OutgoingMessage["type"]; payload: any } | null {
  if (oldText === newText) return null;

  let start = 0;
  while (start < oldText.length && oldText[start] === newText[start]) {
    start++;
  }

  let endOld = oldText.length - 1;
  let endNew = newText.length - 1;
  while (
    endOld >= start &&
    endNew >= start &&
    oldText[endOld] === newText[endNew]
  ) {
    endOld--;
    endNew--;
  }

  const removed = oldText.slice(start, endOld + 1);
  const inserted = newText.slice(start, endNew + 1);

  if (removed.length === 0 && inserted.length > 0) {
    return {
      type: "create" as const,
      payload: { index: start, text: inserted },
    };
  } else if (removed.length > 0 && inserted.length === 0) {
    return {
      type: "delete" as const,
      payload: { start, end: endOld + 1 },
    };
  } else {
    return {
      type: "replace" as const,
      payload: { start, end: endOld + 1, text: inserted },
    };
  }
}
