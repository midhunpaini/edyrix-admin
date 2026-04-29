import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminDoubts,
  useAnswerDoubt,
  useDoubtStats,
  useAssignDoubt,
  useCloseDoubt,
  useBulkCloseDoubts,
  useDoubtTemplates,
} from "../hooks/useDoubts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { AdminDoubt } from "../types";

type Tab = "pending" | "answered" | "closed";

const CLOSE_REASONS = ["spam", "duplicate", "resolved", "inappropriate"];

function slaStyle(doubt: AdminDoubt): string {
  if (doubt.status !== "pending" || doubt.hours_pending === null) return "";
  if (doubt.hours_pending > 12) return "border-l-4 border-l-rose";
  if (doubt.hours_pending > 4) return "border-l-4 border-l-amber";
  return "";
}

function DoubtCard({
  doubt,
  selected,
  onSelect,
  onAnswer,
  onAssign,
  onClose,
}: {
  doubt: AdminDoubt;
  selected: boolean;
  onSelect: (id: string) => void;
  onAnswer: (doubt: AdminDoubt) => void;
  onAssign: (doubt: AdminDoubt) => void;
  onClose: (doubt: AdminDoubt) => void;
}) {
  const sla = slaStyle(doubt);

  return (
    <div className={`bg-white rounded-xl border border-ink/8 p-4 shadow-sm flex items-start gap-3 ${sla}`}>
      {doubt.status === "pending" && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(doubt.id)}
          className="mt-1 w-4 h-4 accent-teal flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-body font-semibold text-ink text-sm">{doubt.student_name}</p>
          {doubt.student_class && <span className="text-xs text-ink-3 font-body">Class {doubt.student_class}</span>}
          {doubt.subject_name && <Badge variant="teal">{doubt.subject_name}</Badge>}
          {doubt.sla_breached && <Badge variant="rose">OVERDUE</Badge>}
          {doubt.hours_pending !== null && doubt.hours_pending > 4 && !doubt.sla_breached && (
            <Badge variant="amber">{Math.round(doubt.hours_pending)}h pending</Badge>
          )}
          {doubt.assigned_to_name && (
            <span className="text-xs text-ink-3 font-body">→ {doubt.assigned_to_name}</span>
          )}
        </div>
        <p className="font-body text-sm text-ink-2 leading-snug">{doubt.question_text}</p>
        {doubt.chapter_title && (
          <p className="text-xs text-ink-3 font-body mt-1">{doubt.chapter_title}</p>
        )}
        <p className="font-body text-xs text-ink-3 mt-1">
          {new Date(doubt.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {doubt.status === "pending" && (
          <>
            <Button size="sm" onClick={() => onAnswer(doubt)}>
              <Icon name={Icons.answer} size={14} className="mr-1" aria-hidden />
              Answer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAssign(doubt)}>
              Assign →
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onClose(doubt)}>
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function DoubtQueuePage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [answerDoubt, setAnswerDoubt] = useState<AdminDoubt | null>(null);
  const [assignDoubt, setAssignDoubt] = useState<AdminDoubt | null>(null);
  const [closeDoubt, setCloseDoubt] = useState<AdminDoubt | null>(null);
  const [bulkCloseOpen, setBulkCloseOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [closeReason, setCloseReason] = useState("resolved");
  const [bulkReason, setBulkReason] = useState("resolved");

  const { data: stats, isLoading: statsLoading } = useDoubtStats();
  const { data: pendingData, isLoading: pendingLoading } = useAdminDoubts("pending");
  const { data: answeredData, isLoading: answeredLoading } = useAdminDoubts("answered");
  const { data: closedData, isLoading: closedLoading } = useAdminDoubts("closed");
  const { data: templates } = useDoubtTemplates();

  const answerMut = useAnswerDoubt();
  const assignMut = useAssignDoubt();
  const closeMut = useCloseDoubt();
  const bulkCloseMut = useBulkCloseDoubts();

  const currentData = tab === "pending" ? pendingData : tab === "answered" ? answeredData : closedData;
  const isLoading = tab === "pending" ? pendingLoading : tab === "answered" ? answeredLoading : closedLoading;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmitAnswer() {
    if (!answerDoubt || !answerText.trim()) return;
    answerMut.mutate(
      { id: answerDoubt.id, answer_text: answerText.trim() },
      { onSuccess: () => { setAnswerDoubt(null); setAnswerText(""); toast.success("Answer sent"); } }
    );
  }

  function handleAssign() {
    if (!assignDoubt || !assignTeacherId) return;
    assignMut.mutate(
      { id: assignDoubt.id, teacher_id: assignTeacherId },
      { onSuccess: () => { setAssignDoubt(null); setAssignTeacherId(""); toast.success("Doubt assigned"); } }
    );
  }

  function handleClose() {
    if (!closeDoubt) return;
    closeMut.mutate(
      { id: closeDoubt.id, reason: closeReason },
      { onSuccess: () => { setCloseDoubt(null); toast.success("Doubt closed"); } }
    );
  }

  function handleBulkClose() {
    bulkCloseMut.mutate(
      { doubt_ids: Array.from(selectedIds), reason: bulkReason },
      {
        onSuccess: () => {
          setBulkCloseOpen(false);
          setSelectedIds(new Set());
          toast.success(`Closed ${selectedIds.size} doubts`);
        },
      }
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Doubt Queue</h2>
          <p className="text-ink-3 text-sm font-body mt-0.5">
            {pendingData ? `${pendingData.total} pending` : "Loading…"}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="secondary" className="text-rose" onClick={() => setBulkCloseOpen(true)}>
            Close selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {!statsLoading && stats && (
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm px-5 py-3 mb-4 flex items-center gap-6 text-sm font-body flex-wrap">
          <span><strong className="text-rose">{stats.pending_count}</strong> pending</span>
          <span className="text-ink-3">·</span>
          <span>Avg response: <strong>{stats.avg_response_hours}h</strong></span>
          <span className="text-ink-3">·</span>
          <span>Answered today: <strong className="text-forest">{stats.answered_today}</strong></span>
          <span className="text-ink-3">·</span>
          <span>SLA breached: <strong className={stats.sla_breached_count > 0 ? "text-rose" : "text-ink"}>{stats.sla_breached_count}</strong></span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-bg rounded-xl p-1 w-fit mb-5">
        {(["pending", "answered", "closed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors capitalize ${
              tab === t ? "bg-white text-ink shadow-sm" : "text-ink-3 hover:text-ink"
            }`}
          >
            {t}
            {t === "pending" && (pendingData?.total ?? 0) > 0 && (
              <span className="ml-1.5 bg-rose text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingData!.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : !currentData?.doubts.length ? (
          <div className="text-center py-16 bg-white rounded-xl border border-ink/8">
            <Icon name={Icons.empty} size={36} className="text-ink/10 mx-auto mb-3 block" aria-hidden />
            <p className="font-body text-ink-3 text-sm">No {tab} doubts</p>
          </div>
        ) : (
          currentData.doubts.map((doubt) => (
            <DoubtCard
              key={doubt.id}
              doubt={doubt}
              selected={selectedIds.has(doubt.id)}
              onSelect={toggleSelect}
              onAnswer={(d) => { setAnswerDoubt(d); setAnswerText(""); }}
              onAssign={(d) => setAssignDoubt(d)}
              onClose={(d) => setCloseDoubt(d)}
            />
          ))
        )}
      </div>

      {/* Answer Modal */}
      <Modal open={!!answerDoubt} onClose={() => setAnswerDoubt(null)} title="Answer Doubt" size="md">
        {answerDoubt && (
          <div className="space-y-4">
            <div className="bg-bg rounded-xl p-4">
              <p className="text-xs font-body font-semibold text-ink-3 mb-1">{answerDoubt.student_name}'s question</p>
              <p className="font-body text-sm text-ink">{answerDoubt.question_text}</p>
            </div>

            {/* Template picker */}
            {templates && templates.length > 0 && (
              <div>
                <label className="block font-body text-sm font-semibold text-ink mb-1">Use Template</label>
                <select
                  onChange={(e) => { if (e.target.value) setAnswerText(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
                >
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.body}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-body text-sm font-semibold text-ink mb-1.5">Your Answer</label>
              <textarea
                rows={6}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type a clear, helpful explanation…"
                className="w-full rounded-xl border border-ink/20 p-3 font-body text-sm text-ink focus:outline-none focus:border-teal resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAnswerDoubt(null)}>Cancel</Button>
              <Button disabled={!answerText.trim() || answerMut.isPending} loading={answerMut.isPending} onClick={handleSubmitAnswer}>
                Send Answer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Modal */}
      <Modal open={!!assignDoubt} onClose={() => setAssignDoubt(null)} title="Assign Doubt" size="sm">
        {assignDoubt && (
          <div className="space-y-4">
            <p className="text-sm font-body text-ink-3">Assign to teacher/admin (enter user ID):</p>
            <input
              type="text"
              value={assignTeacherId}
              onChange={(e) => setAssignTeacherId(e.target.value)}
              placeholder="Teacher user UUID"
              className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignDoubt(null)}>Cancel</Button>
              <Button disabled={!assignTeacherId.trim() || assignMut.isPending} loading={assignMut.isPending} onClick={handleAssign}>
                Assign
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Close Modal */}
      <Modal open={!!closeDoubt} onClose={() => setCloseDoubt(null)} title="Close Doubt" size="sm">
        {closeDoubt && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold font-body text-ink mb-1">Reason</label>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
              >
                {CLOSE_REASONS.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCloseDoubt(null)}>Cancel</Button>
              <Button disabled={closeMut.isPending} loading={closeMut.isPending} onClick={handleClose}>
                Close Doubt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Close Modal */}
      <Modal open={bulkCloseOpen} onClose={() => setBulkCloseOpen(false)} title={`Close ${selectedIds.size} Doubts`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Reason</label>
            <select
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            >
              {CLOSE_REASONS.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkCloseOpen(false)}>Cancel</Button>
            <Button
              variant="secondary"
              className="text-rose"
              disabled={bulkCloseMut.isPending}
              loading={bulkCloseMut.isPending}
              onClick={handleBulkClose}
            >
              Close {selectedIds.size} Doubts
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
