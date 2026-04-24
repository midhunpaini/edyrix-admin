import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useAdminSubjects, useAdminChapters } from "../hooks/useContent";
import { useAdminTests, useCreateTest, usePublishTest } from "../hooks/useTests";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import type { ContentChapter } from "../types";

// ── Question form type ────────────────────────────────────────────────────────

interface QuestionDraft {
  text: string;
  text_ml: string;
  options: [string, string, string, string];
  correct_answer: number;
  explanation: string;
  marks: number;
}

function emptyQuestion(): QuestionDraft {
  return {
    text: "",
    text_ml: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
    marks: 1,
  };
}

// ── Question card in the create-test form ─────────────────────────────────────

function QuestionDraftCard({
  q,
  index,
  onChange,
  onRemove,
}: {
  q: QuestionDraft;
  index: number;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
}) {
  const LABELS = ["A", "B", "C", "D"];
  return (
    <div className="bg-bg rounded-xl border border-ink/8 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-sm text-ink">Q{index + 1}</span>
        <button onClick={onRemove} className="p-1 rounded hover:bg-rose/10 transition-colors">
          <Trash2 size={14} className="text-rose" />
        </button>
      </div>
      <textarea
        rows={2}
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
        placeholder="Question text (English)"
        className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none bg-white"
      />
      <textarea
        rows={2}
        value={q.text_ml}
        onChange={(e) => onChange({ ...q, text_ml: e.target.value })}
        placeholder="Question text (Malayalam)"
        className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none bg-white"
      />
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...q, correct_answer: oi })}
              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                q.correct_answer === oi
                  ? "border-teal bg-teal text-white"
                  : "border-ink/20 text-ink-3 hover:border-teal/40"
              }`}
            >
              {LABELS[oi]}
            </button>
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const opts = [...q.options] as [string, string, string, string];
                opts[oi] = e.target.value;
                onChange({ ...q, options: opts });
              }}
              placeholder={`Option ${LABELS[oi]}`}
              className="flex-1 h-8 px-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal bg-white min-w-0"
            />
          </div>
        ))}
      </div>
      <input
        type="text"
        value={q.explanation}
        onChange={(e) => onChange({ ...q, explanation: e.target.value })}
        placeholder="Explanation (shown after submission)"
        className="w-full h-8 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal bg-white"
      />
    </div>
  );
}

// ── Create Test Modal ─────────────────────────────────────────────────────────

function CreateTestModal({
  open,
  chapter,
  onClose,
}: {
  open: boolean;
  chapter: ContentChapter;
  onClose: () => void;
}) {
  const createTest = useCreateTest();
  const [title, setTitle] = useState(`${chapter.title} — Test`);
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function handleSubmit() {
    if (!title.trim() || questions.length === 0) return;
    const valid = questions.every(
      (q) => q.text.trim() && q.options.every((o) => o.trim())
    );
    if (!valid) return;

    createTest.mutate(
      {
        chapter_id: chapter.id,
        title: title.trim(),
        duration_minutes: parseInt(durationMinutes) || 30,
        total_marks: totalMarks,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          text_ml: q.text_ml.trim(),
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation.trim(),
          marks: q.marks,
        })),
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Create Test — ${chapter.title}`} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Test Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-sm text-ink">
            Questions ({questions.length}) · {totalMarks} marks total
          </p>
          <Button size="sm" variant="secondary" onClick={addQuestion}>
            <Plus size={14} />
            Add Question
          </Button>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionDraftCard
              key={i}
              q={q}
              index={i}
              onChange={(updated) =>
                setQuestions((qs) => qs.map((x, xi) => (xi === i ? updated : x)))
              }
              onRemove={() => setQuestions((qs) => qs.filter((_, xi) => xi !== i))}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ink/8 sticky bottom-0 bg-white py-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!title.trim() || questions.length === 0 || createTest.isPending}
            loading={createTest.isPending}
            onClick={handleSubmit}
          >
            Create Test
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Chapter Test Panel ────────────────────────────────────────────────────────

function ChapterTestPanel({ chapter }: { chapter: ContentChapter }) {
  const { data: test, isLoading } = useAdminTests(chapter.id);
  const publishTest = usePublishTest();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-ink">{chapter.title}</h3>
        <p className="text-xs text-ink-3 font-body">Chapter {chapter.chapter_number}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : !test ? (
        <div className="flex flex-col items-center justify-center py-16 bg-bg rounded-xl border border-ink/8">
          <p className="text-ink-3 text-sm font-body mb-4">No test for this chapter yet.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create Test
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display font-bold text-base text-ink">{test.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-body text-sm text-ink-3">
                  {test.duration_minutes} min · {test.total_marks} marks
                </span>
                <Badge variant={test.is_published ? "forest" : "gray"}>
                  {test.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => publishTest.mutate(test.id)}
              disabled={publishTest.isPending}
            >
              {test.is_published ? (
                <>
                  <EyeOff size={14} />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <CreateTestModal
        open={createOpen}
        chapter={chapter}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function QuestionEditorPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ContentChapter | null>(null);

  const { data: subjects, isLoading: subjectsLoading } = useAdminSubjects();
  const { data: subjectDetail, isLoading: chaptersLoading } = useAdminChapters(
    selectedSubjectId ?? undefined
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Question Editor</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Create and manage chapter tests</p>
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
              subjects?.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setSelectedChapter(null);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-body transition-colors ${
                    selectedSubjectId === subject.id
                      ? "bg-teal/10 text-teal font-semibold"
                      : "text-ink hover:bg-bg"
                  }`}
                >
                  <span className="flex-1 truncate">{subject.name}</span>
                  <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
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
              <p className="text-center text-ink-3 text-sm font-body py-8">Select a subject</p>
            ) : chaptersLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : (
              subjectDetail?.chapters?.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-body transition-colors ${
                    selectedChapter?.id === chapter.id
                      ? "bg-teal/10 text-teal font-semibold"
                      : "text-ink hover:bg-bg"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-ink/8 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {chapter.chapter_number}
                  </span>
                  <span className="flex-1 truncate">{chapter.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Test panel */}
        <div className="flex-1 bg-white rounded-xl border border-ink/8 shadow-sm overflow-y-auto">
          {!selectedChapter ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-ink-3 text-sm font-body">Select a chapter</p>
            </div>
          ) : (
            <ChapterTestPanel chapter={selectedChapter} />
          )}
        </div>
      </div>
    </div>
  );
}
