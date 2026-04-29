import { useState } from "react";
import { toast } from "sonner";
import { useSendNotification, useNotificationHistory } from "../hooks/useNotifications";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";

const SEGMENTS = [
  { value: "all", label: "All Students" },
  { value: "trial", label: "Trial Users Only" },
  { value: "subscribed", label: "Subscribers Only" },
  { value: "inactive_7d", label: "Inactive (7+ days)" },
  { value: "class_10", label: "Class 10" },
  { value: "class_9", label: "Class 9" },
  { value: "class_8", label: "Class 8" },
  { value: "class_7", label: "Class 7" },
];

const TITLE_LIMIT = 65;
const BODY_LIMIT = 240;

export function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");

  const send = useSendNotification();
  const { data: history, isLoading: histLoading } = useNotificationHistory();

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    send.mutate(
      { title: title.trim(), body: body.trim(), target_segment: segment },
      {
        onSuccess: (data: { target_count: number; sent_count: number }) => {
          toast.success(`Sent to ${data.sent_count} students`);
          setTitle("");
          setBody("");
          setSegment("all");
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Send failed"),
      }
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Notifications</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Send push notifications to students</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Send form */}
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-6 space-y-5">
          <h3 className="font-display font-bold text-base text-ink">Compose Notification</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold font-body text-ink">Title</label>
              <span className={`text-xs font-body ${title.length > TITLE_LIMIT ? "text-rose" : "text-ink-3"}`}>
                {title.length}/{TITLE_LIMIT}
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
              placeholder="Notification title"
              className="w-full h-10 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold font-body text-ink">Body</label>
              <span className={`text-xs font-body ${body.length > BODY_LIMIT ? "text-rose" : "text-ink-3"}`}>
                {body.length}/{BODY_LIMIT}
              </span>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_LIMIT))}
              placeholder="Notification message"
              className="w-full rounded-lg border border-ink/20 p-3 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold font-body text-ink block mb-2">Target Segment</label>
            <div className="space-y-2">
              {SEGMENTS.map((s) => (
                <label key={s.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="segment"
                    value={s.value}
                    checked={segment === s.value}
                    onChange={() => setSegment(s.value)}
                    className="w-4 h-4 accent-teal"
                  />
                  <span className="text-sm font-body text-ink">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!title.trim() || !body.trim() || send.isPending}
            loading={send.isPending}
            onClick={handleSend}
          >
            Send Notification →
          </Button>
        </div>

        {/* Preview + right column */}
        <div className="space-y-6">
          {/* Phone mockup preview */}
          <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-6">
            <h3 className="font-display font-bold text-base text-ink mb-4">Preview</h3>
            <div className="bg-bg rounded-xl p-4 border border-ink/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">E</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-3 font-body">Edyrix · now</p>
                  </div>
                  <p className="text-sm font-semibold font-body text-ink mt-0.5 truncate">
                    {title || "Notification title"}
                  </p>
                  <p className="text-xs font-body text-ink-2 mt-0.5 line-clamp-2">
                    {body || "Notification message will appear here"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Segment info */}
          <div className="bg-teal/5 border border-teal/20 rounded-xl p-4">
            <p className="text-sm font-body text-teal font-semibold">
              Segment: {SEGMENTS.find((s) => s.value === segment)?.label}
            </p>
            <p className="text-xs font-body text-ink-3 mt-1">
              All users in this segment with FCM tokens will receive the notification.
            </p>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="mt-8 bg-white rounded-xl border border-ink/8 shadow-sm p-6">
        <h3 className="font-display font-bold text-base text-ink mb-4">Notification History</h3>
        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !history?.length ? (
          <p className="text-sm text-ink-3 font-body">No notifications sent yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-ink/8">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Title</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Segment</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Sent To</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Success</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Failed</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Status</th>
                  <th className="text-left py-2 text-xs font-semibold text-ink-3">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((n) => (
                  <tr key={n.id} className="border-b border-ink/5 hover:bg-bg/50">
                    <td className="py-3 pr-4 font-semibold text-ink">{n.title}</td>
                    <td className="py-3 pr-4 text-ink-3">{n.target_segment}</td>
                    <td className="py-3 pr-4 text-ink">{n.target_count}</td>
                    <td className="py-3 pr-4 text-forest font-semibold">{n.sent_count}</td>
                    <td className="py-3 pr-4 text-rose">{n.failed_count}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={n.status === "sent" ? "forest" : n.status === "failed" ? "rose" : "gray"}>
                        {n.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-ink-3 text-xs">
                      {n.sent_at
                        ? new Date(n.sent_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
