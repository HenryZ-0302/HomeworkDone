import Dexie, { type Table } from "dexie";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatThreadRecord {
  id: string;
  title: string;
  sourceId: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown> | null;
}

export interface ChatMessageRecord {
  id: string;
  chatId: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

class ChatDatabase extends Dexie {
  threads!: Table<ChatThreadRecord, string>;
  messages!: Table<ChatMessageRecord, string>;

  constructor() {
    super("skid-homework-chat-db");

    this.version(1).stores({
      threads: "id, updatedAt, createdAt",
      messages: "id, chatId, createdAt, [chatId+createdAt]",
    });
  }
}

export const chatDb = new ChatDatabase();

export const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};
