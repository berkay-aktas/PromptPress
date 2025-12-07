export type CommentStatus = "visible" | "hidden";

export interface CommentUser {
  _id: string;
  name: string;
  email: string;
}

export interface CommentDoc {
  _id: string;
  blog: string;
  user: CommentUser | null;
  text: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
}

export type IComment = CommentDoc;

