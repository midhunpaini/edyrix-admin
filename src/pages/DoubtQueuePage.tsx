import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAdminDoubts, useAnswerDoubt } from "../hooks/useDoubts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import type { AdminDoubt } from "../types";

type Tab = "pending" | "answered";

function DoubtCard({
  doubt,
  onAnswer,
}: {
  doubt: AdminDoubt;
  onAnswer: (doubt: AdminDoubt) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-ink/8 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-body font-semibold text-ink text-sm">{doubt.student_name}</p>
            <Badge variant={doubt.status === "answered" ? "forest" : "amber"}>
              {doubt.status}
            </Badge>
          </div>
          <p className="font-body text-sm text-ink-2 leading-snug">{doubt.question_text}</p>
          <p className="font-body text-xs text-ink-3 mt-1">
            {new Date(doubt.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {doubt.status === "pending" && (
          <Button size="sm" onClick={() => onAnswer(doubt)}>
            Answer
          </Button>
        )}
      </div>
    </div>
  );
}

export function DoubtQueuePage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedDoubt, setSelectedDoubt] = useState<AdminDoubt | null>(null);
  const [answerText, setAnswerText] = useState("");

  const { data: pendingData, isLoading: pendingLoading } = useAdminDoubts("pending");
  const { data: answeredData, isLoading: answeredLoading } = useAdminDoubts("answered");
  const answerMutation = useAnswerDoubt();

  const currentData = tab === "pending" ? pendingData : answeredData;
  const isLoading = tab === "pending" ? pendingLoading : answeredLoading;

  function handleOpenAnswer(doubt: AdminDoubt) {
    setSelectedDoubt(doubt);
    setAnswerText("");
  }

  function handleSubmitAnswer() {
    if (!selectedDoubt || !answerText.trim()) return;
    answerMutation.mutate(
      { id: selectedDoubt.id, answer_text: answerText.trim() },
      { onSuccess: () => setSelectedDoubt(null) }
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Doubt Queue</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">
          {pendingData ? `${pendingData.total} pending` : "Loading…"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg rounded-xl p-1 w-fit mb-5">
        {(["pending", "answered"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : !currentData?.doubts.length ? (
          <div className="text-center py-16 bg-white rounded-xl border border-ink/8">
            <MessageSquare size={36} className="text-ink/10 mx-auto mb-3" />
            <p className="font-body text-ink-3 text-sm">
              No {tab} doubts
            </p>
          </div>
        ) : (
          currentData.doubts.map((doubt) => (
            <DoubtCard key={doubt.id} doubt={doubt} onAnswer={handleOpenAnswer} />
          ))
        )}
      </div>

      {/* Answer modal */}
      <Modal
        open={!!selectedDoubt}
        onClose={() => setSelectedDoubt(null)}
        title="Answer Doubt"
        size="md"
      >
        {selectedDoubt && (
          <div className="space-y-4">
            <div className="bg-bg rounded-xl p-4">
              <p className="text-xs font-body font-semibold text-ink-3 mb-1">
                {selectedDoubt.student_name}'s question
              </p>
              <p className="font-body text-sm text-ink">{selectedDoubt.question_text}</p>
            </div>
            <div>
              <label className="block font-body text-sm font-semibold text-ink mb-1.5">
                Your Answer
              </label>
              <textarea
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type a clear, helpful explanation…"
                className="w-full rounded-xl border border-ink/20 p-3 font-body text-sm text-ink focus:outline-none focus:border-teal resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedDoubt(null)}>
                Cancel
              </Button>
              <Button
                disabled={!answerText.trim() || answerMutation.isPending}
                loading={answerMutation.isPending}
                onClick={handleSubmitAnswer}
              >
                Send Answer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
