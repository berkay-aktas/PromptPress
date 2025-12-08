export interface IRevision {
  _id: string;
  blog: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  what: string;
  how: string;
  createdAt: string;
  updatedAt: string;
}

