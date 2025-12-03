import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-gray-50">
      <main className="flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          Welcome to Prompt Press
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl">
          AI-powered drafting and publishing platform. Create, edit, and publish
          your articles with the help of artificial intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12 sm:mb-16">
          <Link
            href="/create"
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            ✍️ Create New Draft
          </Link>
          <Link
            href="/feed"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            📰 Browse Feed
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Generate full article drafts from simple prompts using advanced AI
              technology.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Editing
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Use targeted AI edits to refine specific sections of your content
              with natural language instructions.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Publishing
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Publish your drafts to the public feed with a single click and
              share your work with the world.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
