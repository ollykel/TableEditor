import React, { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080/ws";

// Define the types for incoming and outgoing messages
type InitMessage = { type: "init"; client_id: number; text: string; lock_owner_id?: number };
type InsertMessage = { type: "insert"; client_id: number; index: number; text: string };
type DeleteMessage = { type: "delete"; client_id: number; start: number; end: number };
type ReplaceMessage = { type: "replace"; client_id: number; start: number; end: number; text: string };
type AcquireLockMessage = { type: "acquire_lock"; client_id: number };
type ReleaseLockMessage = { type: "release_lock" };

type IncomingMessage = InitMessage | InsertMessage | DeleteMessage | ReplaceMessage | AcquireLockMessage | ReleaseLockMessage;

type OutgoingMessage = InsertMessage | DeleteMessage | ReplaceMessage;

export default function TextEditor(): React.JSX.Element {
  const [text, setText] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [clientId, setClientId] = useState<number>(-1);
  const [lockOwnerId, setLockOwnerId] = useState<number>(-1);
  const clientIdRef = useRef<number>(clientId);
  const lockOwnerIdRef = useRef<number>(lockOwnerId);
  const socketRef = useRef<WebSocket | null>(null);
  const textRef = useRef<string>(text);
  const isLocked = (lockOwnerId !== -1) && (lockOwnerId !== clientId);

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
          {
            console.log('Client ID:', msg.client_id);
            setText(msg.text);
            setClientId(msg.client_id);
            clientIdRef.current = msg.client_id;

            if (msg.lock_owner_id) {
              setLockOwnerId(msg.lock_owner_id);
              lockOwnerIdRef.current = msg.lock_owner_id;
            } else {
              setLockOwnerId(-1);
              lockOwnerIdRef.current = -1;
            }
          }
          break;

        case "insert":
          console.log('CREATE id:', msg.client_id);
          console.log('(client id:', clientId, ')');
          if (msg.client_id !== clientIdRef.current)
          {
            const before = currentText.slice(0, msg.index);
            const after = currentText.slice(msg.index);
            setText(before + msg.text + after);
          }
          break;

        case "delete":
          console.log('DELETE id:', msg.client_id);
          if (msg.client_id !== clientIdRef.current)
          {
            const before = currentText.slice(0, msg.start);
            const after = currentText.slice(msg.end);
            setText(before + after);
          }
          break;

        case "replace":
          console.log('REPLACE id:', msg.client_id);
          if (msg.client_id !== clientIdRef.current)
          {
            const before = currentText.slice(0, msg.start);
            const after = currentText.slice(msg.end);
            setText(before + msg.text + after);
          }
          break;
        case "acquire_lock":
          {
            setLockOwnerId(msg.client_id);
            lockOwnerIdRef.current = msg.client_id;
            console.log('Lock acquired by', msg.client_id);
          }
          break;
        case "release_lock":
          {
            setLockOwnerId(-1);
            lockOwnerIdRef.current = -1;
            console.log('Lock released');
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

    const message: OutgoingMessage = { type, client_id: clientId, ...payload } as OutgoingMessage;
    socketRef.current?.send(JSON.stringify(message));

    setText(newText);
  };

  return (
    <div>
      {connected && isLocked && <p style={{ color: "red" }}>Lock acquired by client {lockOwnerId}</p>}
      <textarea
        rows={20}
        cols={100}
        value={text}
        onChange={handleChange}
        disabled={!connected || isLocked}
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
      type: "insert" as const,
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
