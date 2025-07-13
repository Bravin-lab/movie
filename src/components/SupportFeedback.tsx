"use client";

import React, { useState } from "react";

export default function SupportFeedback() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/support-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send feedback");
      }

      setStatus("success");
      setEmail("");
      setMessage("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send feedback");
      }
      setStatus("error");
    }
  };

  return (
    <section className="mb-12 bg-gray-800 bg-opacity-60 rounded-lg p-6 shadow-md backdrop-blur-sm max-w-md">
      <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Support & Feedback</h2>
      {status === "success" && <p className="text-green-400 mb-4">Thank you for your feedback!</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email (optional)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Your email address"
          />
        </div>
        <div>
          <label htmlFor="message" className="block mb-1 font-medium">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 resize-none"
            placeholder="Describe your issue or suggestion"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </section>
  );
}
