"use client";

import { useState } from "react";

interface ShareBarProps {
  url: string;
  title: string;
}

export default function ShareBar({ url, title }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  const xUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex space-x-3">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        aria-label="Share on X"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M18.244 2H21l-6.56 7.5L22 22h-6.844l-4.3-5.625L5.844 22H3l7.12-8.145L2 2h6.965l3.906 5.195L18.244 2zm-1.2 18h1.83L8.73 4h-1.83l10.144 16z" />
        </svg>
      </a>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors duration-200"
        aria-label="Share on Facebook"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.01 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.93 8.44-9.94z" />
        </svg>
      </a>
      <a
        href={liUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
        aria-label="Share on LinkedIn"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5C0 2.12 1.12 1 2.5 1S4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V24h-5v-7.4c0-1.77-.03-4.05-2.47-4.05-2.47 0-2.85 1.93-2.85 3.93V24h-5V8z" />
        </svg>
      </a>
      <button
        onClick={onCopy}
        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        aria-label="Copy link"
        type="button"
      >
        {copied ? (
          <span className="text-xs">Copied</span>
        ) : (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16h8a2 2 0 002-2V7a2 2 0 00-2-2h-5m-3 11H7a2 2 0 01-2-2V7a2 2 0 012-2h5m0 0L8 8m4-3l-4 3"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
