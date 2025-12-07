
export type BlogStatus = "pending" | "created" | "published" | "error";

export interface BlogDoc {
    _id: string; 
    prompt: string;
    aiResult?: string;
    
    status: BlogStatus; 
    errorMessage?: string | null;
    
    
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;

    author?: string | null;
    authorId?: string | null;
    tags?: Array<{ _id: string; name: string; slug: string }>;
}


export type IBlogDetail = BlogDoc;
export type IBlogCard = Pick<BlogDoc, '_id' | 'prompt' | 'status' | 'author' | 'aiResult'>;