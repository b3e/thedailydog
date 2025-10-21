"use client";

import { useState } from "react";

interface SubscriptionFormProps {
  source?: string;
  className?: string;
}

export default function SubscriptionForm({
  source = "website",
  className = "",
}: SubscriptionFormProps) {
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !gdprConsent) {
      setMessage("Please provide your email and accept the privacy policy.");
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Thank you for subscribing! You'll receive our latest updates."
        );
        setIsSuccess(true);
        setEmail("");
        setGdprConsent(false);
      } else {
        setMessage(data.error || "Something went wrong. Please try again.");
        setIsSuccess(false);
      }
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Stay Informed
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Get the latest news and updates from The Daily Dog delivered to your
          inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="gdpr-consent"
            checked={gdprConsent}
            onChange={(e) => setGdprConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
            disabled={isSubmitting}
          />
          <label
            htmlFor="gdpr-consent"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            I agree to receive email updates from The Daily Dog and understand
            that I can unsubscribe at any time.
            <a
              href="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email || !gdprConsent}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </button>

        {message && (
          <div
            className={`text-sm p-3 rounded-lg ${
              isSuccess
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </form>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>
          We respect your privacy. Unsubscribe at any time.
          <a
            href="/privacy"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
