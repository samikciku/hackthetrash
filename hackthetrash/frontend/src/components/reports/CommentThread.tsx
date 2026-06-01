"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/apiBase";

type Comment = {
  id: string;
  text: string;
  author_name: string | null;
  user_id: string | null;
  created_at: string;
};

export default function CommentThread({ reportId }: { reportId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch(`${getApiBase()}/api/reports/${reportId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [reportId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/reports/${reportId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          anonymous: !user,
          authorName: user ? undefined : (authorName.trim() || undefined)
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setText("");
      load();
    } catch (e: any) {
      alert(e?.message ?? "Comment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 border-t pt-3">
      <div className="font-semibold text-sm mb-2">{t("comments.title")}</div>

      {loading ? (
        <div className="text-xs text-gray-400">{t("common.loading")}</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-400">{t("comments.empty")}</div>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li key={c.id} className="text-xs bg-gray-50 rounded p-2">
              <div className="font-semibold text-gray-700">
                {c.author_name || t("comments.anonymous")}
                <span className="ml-2 text-gray-400 font-normal">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-gray-800 mt-0.5 whitespace-pre-wrap">{c.text}</div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-2 space-y-1">
        {!user && (
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t("comments.namePlaceholder")}
            className="w-full text-xs border rounded px-2 py-1"
            maxLength={60}
          />
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("comments.placeholder")}
          className="w-full text-xs border rounded px-2 py-1 resize-none"
          rows={2}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="w-full bg-primary text-white text-xs font-semibold py-1.5 rounded hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? t("common.loading") : t("comments.send")}
        </button>
      </form>
    </div>
  );
}
