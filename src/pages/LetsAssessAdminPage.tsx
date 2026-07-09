import { useState } from "react";
import { toast } from "sonner";
import { useAdminSubjects, useAdminChapters } from "../hooks/useContent";
import { useAdminLetsAssess, useCreateLetsAssess, useUpdateLetsAssess, useDeleteLetsAssess } from "../hooks/useLetsAssess";
import { useTopics } from "../hooks/useTopics";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { ContentChapter, LetsAssessAdminQuestion, Topic } from "../types";

const INPUT_CLS =
  "w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal bg-white";
const TEXTAREA_CLS =
  "w-full px-3 py-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none bg-white";

// ── Question Form Modal ───────────────────────────────────────────────────────

function QuestionModal({
  open,
  onClose,
  chapter,
  topics,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  chapter: ContentChapter;
  topics: Topic[];
  existing: LetsAssessAdminQuestion | null;
}) {
  const isEdit = existing !== null;
  const createQ = useCreateLetsAssess();
  const updateQ = useUpdateLetsAssess();

  const [questionNumber, setQuestionNumber] = useState(existing?.question_number ?? 1);
  const [questionText, setQuestionText] = useState(existing?.question_text ?? "");
  const [questionTextMl, setQuestionTextMl] = useState(existing?.question_text_ml ?? "");
  const [marks, setMarks] = useState(existing?.marks ?? 1);
  const [topicId, setTopicId] = useState(existing?.topic_id ?? "");
  const [modelAnswer, setModelAnswer] = useState(existing?.model_answer ?? "");
  const [modelAnswerMl, setModelAnswerMl] = useState(existing?.model_answer_ml ?? "");
  const [walkthroughVideoId, setWalkthroughVideoId] = useState(existing?.walkthrough_video_id ?? "");
  const [walkthroughStart, setWalkthroughStart] = useState(existing?.walkthrough_start_seconds ?? 0);
  const [orderIndex, setOrderIndex] = useState(existing?.order_index ?? 0);
  const [error, setError] = useState<string | null>(null);

  const isPending = createQ.isPending || updateQ.isPending;
  const isValid = questionText.trim().length > 0 && modelAnswer.trim().length > 0;

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    const payload = {
      chapter_id: chapter.id,
      topic_id: topicId || undefined,
      question_number: questionNumber,
      question_text: questionText.trim(),
      question_text_ml: questionTextMl.trim() || undefined,
      marks,
      model_answer: modelAnswer.trim(),
      model_answer_ml: modelAnswerMl.trim() || undefined,
      walkthrough_video_id: walkthroughVideoId.trim() || undefined,
      walkthrough_start_seconds: walkthroughVideoId.trim() ? walkthroughStart : undefined,
      order_index: orderIndex,
    };

    if (isEdit && existing) {
      updateQ.mutate(
        { id: existing.id, ...payload },
        {
          onSuccess: () => { toast.success("Question updated"); handleClose(); },
          onError: (e: any) => setError(e?.response?.data?.detail ?? "Failed to update"),
        }
      );
    } else {
      createQ.mutate(payload, {
        onSuccess: () => { toast.success("Question created"); handleClose(); },
        onError: (e: any) => setError(e?.response?.data?.detail ?? "Failed to create"),
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Question" : `Add Question — ${chapter.title}`}
      size="lg"
    >
      <div className="space-y-4 pb-1">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">Q Number</label>
            <input
              type="number"
              min={1}
              value={questionNumber}
              onChange={(e) => setQuestionNumber(Number(e.target.value))}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">Marks</label>
            <input
              type="number"
              min={1}
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">Order</label>
            <input
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold font-body text-ink mb-1">Topic (optional)</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">— No topic —</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Question (English) <span className="text-rose">*</span>
            </label>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type the question text…"
              className={TEXTAREA_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Question (Malayalam)
            </label>
            <textarea
              rows={4}
              value={questionTextMl}
              onChange={(e) => setQuestionTextMl(e.target.value)}
              placeholder="ചോദ്യം…"
              className={TEXTAREA_CLS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Model Answer (English) <span className="text-rose">*</span>
            </label>
            <textarea
              rows={4}
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="Model answer…"
              className={TEXTAREA_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Model Answer (Malayalam)
            </label>
            <textarea
              rows={4}
              value={modelAnswerMl}
              onChange={(e) => setModelAnswerMl(e.target.value)}
              placeholder="മോഡൽ ഉത്തരം…"
              className={TEXTAREA_CLS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Walkthrough YouTube Video ID
            </label>
            <input
              type="text"
              value={walkthroughVideoId}
              onChange={(e) => setWalkthroughVideoId(e.target.value)}
              placeholder="e.g. dQw4w9WgXcQ"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body text-ink mb-1">
              Start Time (seconds)
            </label>
            <input
              type="number"
              min={0}
              value={walkthroughStart}
              onChange={(e) => setWalkthroughStart(Number(e.target.value))}
              disabled={!walkthroughVideoId.trim()}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose font-body">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-ink/8 sticky bottom-0 bg-white py-3">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button disabled={!isValid || isPending} loading={isPending} onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Add Question"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Chapter Questions Panel ───────────────────────────────────────────────────

function ChapterQuestionsPanel({ chapter }: { chapter: ContentChapter }) {
  const { data: questions, isLoading } = useAdminLetsAssess(chapter.id);
  const { data: topics = [] } = useTopics(chapter.id);
  const deleteQ = useDeleteLetsAssess();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LetsAssessAdminQuestion | null>(null);

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.title]));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display font-bold text-lg text-ink">{chapter.title}</h3>
          <p className="text-xs text-ink-3 font-body">Chapter {chapter.chapter_number} · Let's Assess Questions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Icon name={Icons.add} size={18} className="mr-1.5" aria-hidden />
          Add Question
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !questions?.length ? (
        <div className="flex flex-col items-center justify-center py-16 bg-bg rounded-xl border border-ink/8 gap-3">
          <Icon name={Icons.chapter} size={32} className="text-ink/20" aria-hidden />
          <p className="text-ink-3 text-sm font-body">No Let's Assess questions yet</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name={Icons.add} size={18} className="mr-1.5" aria-hidden />
            Add First Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="group bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="mt-0.5 w-7 h-7 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {q.question_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink leading-relaxed line-clamp-2">
                      {q.question_text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="gray">{q.marks} {q.marks === 1 ? "mark" : "marks"}</Badge>
                      {q.topic_id && topicMap[q.topic_id] && (
                        <Badge variant="teal">{topicMap[q.topic_id]}</Badge>
                      )}
                      {q.walkthrough_video_id && (
                        <Badge variant="amber">Walkthrough</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditTarget(q)}
                    className="w-8 h-8 rounded-lg hover:bg-ink/5 flex items-center justify-center transition-colors"
                    aria-label="Edit question"
                  >
                    <Icon name={Icons.edit} size={16} className="text-ink-2" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      deleteQ.mutate(
                        { id: q.id, chapter_id: chapter.id },
                        {
                          onSuccess: () => toast.success("Question deleted"),
                          onError: () => toast.error("Delete failed"),
                        }
                      )
                    }
                    className="w-8 h-8 rounded-lg hover:bg-rose/10 flex items-center justify-center transition-colors"
                    aria-label="Delete question"
                  >
                    <Icon name={Icons.delete} size={16} className="text-rose" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        chapter={chapter}
        topics={topics}
        existing={null}
      />
      {editTarget && (
        <QuestionModal
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          chapter={chapter}
          topics={topics}
          existing={editTarget}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LetsAssessAdminPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ContentChapter | null>(null);

  const { data: subjects, isLoading: subjectsLoading } = useAdminSubjects();
  const { data: subjectDetail, isLoading: chaptersLoading } = useAdminChapters(
    selectedSubjectId ?? undefined
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Let's Assess</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Manage textbook "Let's Assess" questions per chapter</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-13rem)] overflow-hidden">
        {/* Subjects column */}
        <div className="w-48 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8">
            <p className="font-display font-bold text-sm text-ink">Subjects</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {subjectsLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : (
              subjects?.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelectedSubjectId(s.id); setSelectedChapter(null); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-body transition-colors ${
                    selectedSubjectId === s.id
                      ? "bg-teal text-white font-semibold"
                      : "text-ink hover:bg-bg"
                  }`}
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chapters column */}
        <div className="w-56 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8">
            <p className="font-display font-bold text-sm text-ink">Chapters</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {!selectedSubjectId ? (
              <p className="text-xs text-ink-3 font-body px-4 py-6">Select a subject</p>
            ) : chaptersLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : (
              subjectDetail?.chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapter(ch)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    selectedChapter?.id === ch.id
                      ? "bg-teal/10 font-semibold text-teal"
                      : "text-ink hover:bg-bg"
                  }`}
                >
                  <p className="text-sm font-body truncate">Ch {ch.chapter_number}. {ch.title}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Questions panel */}
        <div className="flex-1 bg-white rounded-xl border border-ink/8 shadow-sm overflow-y-auto">
          {!selectedChapter ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Icon name={Icons.chapter} size={36} className="text-ink/20" aria-hidden />
              <p className="text-sm text-ink-3 font-body">Select a chapter to manage questions</p>
            </div>
          ) : (
            <ChapterQuestionsPanel chapter={selectedChapter} />
          )}
        </div>
      </div>
    </div>
  );
}
