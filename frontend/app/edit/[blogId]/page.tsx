import { notFound } from "next/navigation";
import EditForm from "./EditForm";
import { IBlogDetail } from "@/types/Blog";

interface EditPageProps {
  params: Promise<{
    blogId: string;
  }> | {
    blogId: string;
  };
}

// Next.js Server Component (Asenkron fonksiyon)
export default async function EditPage({ params }: EditPageProps) {
  // Handle both Promise and direct params (for Next.js 16 compatibility)
  const resolvedParams = params instanceof Promise ? await params : params;
  const blogId = resolvedParams.blogId;

  // 1. ID Kontrolü
  if (!blogId) {
    notFound();
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Backend'den veriyi çekme
  try {
    const res = await fetch(
      `${API_BASE_URL}/blogs/get-by-id?blog_id=${blogId}`,
      {
        method: "GET",
        // en iyi taslak için
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      // Draft not found
      notFound();
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch draft: ${res.statusText}`);
    }

    const data = await res.json();
    const draft: IBlogDetail = data;

    if (!draft || draft.status === "pending") {
      return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Draft Still Generating
            </h1>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
              This draft cannot be edited yet. Please wait for the AI to finish generating the content, then check back on your Profile page.
            </p>
            <a
              href="/profile"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Go to Profile
            </a>
          </div>
        </div>
      );
    }

    // Allow editing published posts (they become drafts when edited)
    if (draft.status === "published") {
      // Show a note that editing will unpublish
    }

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Edit Draft
          </h1>
          <p className="text-gray-600 text-base">
            {draft.prompt}
          </p>
        </div>
        <EditForm initialData={draft} />
      </div>
    );
  } catch (error) {
    console.error("Data fetching error on Edit Page:", error);

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Could Not Load Draft
          </h1>
          <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
            A network or server error occurred while fetching this draft. Please try again or return to your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/profile"
              className="bg-white text-indigo-600 border border-indigo-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors text-center"
            >
              Back to Profile
            </a>
          </div>
        </div>
      </div>
    );
  }
}
