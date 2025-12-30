"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { PlanPreview } from "@/components/PlanPreview";
import type { SuggestedMilestone, SuggestedTodo } from "@/lib/ai/claude";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PlanningChatProps {
  goalId: string;
  goalTitle: string;
  initialMessages?: Message[];
  initialSessionId?: string;
}

export function PlanningChat({
  goalId,
  goalTitle,
  initialMessages = [],
  initialSessionId,
}: PlanningChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId
  );
  const [error, setError] = useState<string | null>(null);
  const [suggestedMilestones, setSuggestedMilestones] = useState<
    SuggestedMilestone[]
  >([]);
  const [suggestedTodos, setSuggestedTodos] = useState<SuggestedTodo[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial message if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("Hi! I'd like help planning this goal.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    setError(null);
    setLoading(true);

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          message: messageText,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setSessionId(data.data.sessionId);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggested items
      if (data.data.suggestedMilestones) {
        setSuggestedMilestones((prev) => [
          ...prev,
          ...data.data.suggestedMilestones,
        ]);
      }
      if (data.data.suggestedTodos) {
        setSuggestedTodos((prev) => [...prev, ...data.data.suggestedTodos]);
      }
      if (data.data.isComplete) {
        setIsComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Planning: {goalTitle}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 pb-2">
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading || isComplete}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || isComplete}
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-1">
        {(suggestedMilestones.length > 0 || suggestedTodos.length > 0) &&
          sessionId && (
            <PlanPreview
              sessionId={sessionId}
              goalId={goalId}
              milestones={suggestedMilestones}
              todos={suggestedTodos}
            />
          )}

        {suggestedMilestones.length === 0 && suggestedTodos.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="font-medium">Chat with AI</p>
            <p className="text-sm mt-1">
              Discuss your goal and the AI will suggest milestones and todos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
