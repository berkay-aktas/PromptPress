export interface IStats {
  posts: {
    total: number;
    published: number;
    drafts: number;
    pending: number;
    error: number;
    byStatus: {
      published: number;
      created: number;
      pending: number;
      error: number;
    };
    recent: number;
  };
  comments: {
    total: number;
    visible: number;
    hidden: number;
    recent: number;
  };
  users: {
    total: number;
    admins: number;
    authors: number;
    recent: number;
  };
  tags: {
    total: number;
  };
}

