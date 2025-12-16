import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 sm:mb-6 leading-tight">
          Welcome to Prompt <span className="text-indigo-600">Press</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 sm:mb-12 leading-relaxed max-w-2xl">
          AI-powered drafting and publishing platform. Create, edit, and publish
          your articles with the help of artificial intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-16 sm:mb-20">
          <Link
            href="/create"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
          >
            Create New Draft
          </Link>
          <Link
            href="/feed"
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium text-sm sm:text-base border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
          >
            Browse Feed
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              AI-Powered
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Generate full article drafts from simple prompts using advanced AI
              technology.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Smart Editing
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Use targeted AI edits to refine specific sections of your content
              with natural language instructions.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="text-3xl mb-4">📤</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Easy Publishing
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Publish your drafts to the public feed with a single click and
              share your work with the world.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
