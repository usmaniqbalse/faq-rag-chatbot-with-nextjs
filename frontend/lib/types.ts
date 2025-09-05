export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface AskResponse {
  answer: string;
  retrieved: string[][];
  reranked_ids: number[];
}
