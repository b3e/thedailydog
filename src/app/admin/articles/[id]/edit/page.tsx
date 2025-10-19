import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function EditArticlePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Article
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Update your article content and settings
              </p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form
            action={async (formData) => {
              "use server";
              const title = formData.get("title") as string;
              const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              const excerpt = formData.get("excerpt") as string;
              const content = formData.get("content") as string;
              const imageUrl = formData.get("imageUrl") as string;
              const sourceText = formData.get("sourceText") as string;
              const sourceImageUrl = formData.get("sourceImageUrl") as string;
              const topic = formData.get("topic") as string;
              const isFeatured = formData.get("isFeatured") === "on";
              const publish = formData.get("publish") === "on";

              await prisma.article.update({
                where: { id },
                data: {
                  title,
                  slug,
                  excerpt,
                  content,
                  imageUrl: imageUrl || null,
                  sourceText: sourceText || null,
                  sourceImageUrl: sourceImageUrl || null,
                  topic: topic || null,
                  isFeatured,
                  publishedAt:
                    publish && !article.publishedAt
                      ? new Date()
                      : article.publishedAt,
                },
              });

              redirect("/admin");
            }}
          >
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      defaultValue={article.title}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="topic"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Topic/Category
                    </label>
                    <select
                      name="topic"
                      id="topic"
                      defaultValue={article.topic || ""}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Select a topic...</option>
                      <option value="Politics">Politics</option>
                      <option value="Economy">Economy</option>
                      <option value="Culture">Culture</option>
                      <option value="Opinion">Opinion</option>
                      <option value="Breaking News">Breaking News</option>
                      <option value="International">International</option>
                      <option value="Technology">Technology</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                      <option value="Environment">Environment</option>
                      <option value="Sports">Sports</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="excerpt"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Excerpt
                    </label>
                    <textarea
                      name="excerpt"
                      id="excerpt"
                      rows={4}
                      defaultValue={article.excerpt || ""}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="imageUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      id="imageUrl"
                      defaultValue={article.imageUrl || ""}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="sourceText"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Facebook Post Text (Source Material)
                    </label>
                    <textarea
                      name="sourceText"
                      id="sourceText"
                      rows={6}
                      defaultValue={article.sourceText || ""}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sourceImageUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Facebook Post Image URL
                    </label>
                    <input
                      type="url"
                      name="sourceImageUrl"
                      id="sourceImageUrl"
                      defaultValue={article.sourceImageUrl || ""}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Content *
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={12}
                  defaultValue={article.content}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    id="isFeatured"
                    defaultChecked={article.isFeatured}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Featured Article
                  </label>
                </div>

                {!article.publishedAt && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="publish"
                      id="publish"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <label
                      htmlFor="publish"
                      className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Publish Now
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Update Article
                </button>
                <a
                  href="/admin"
                  className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Cancel
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
