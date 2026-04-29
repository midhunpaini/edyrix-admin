import { useState } from "react";
import { toast } from "sonner";
import { useAdminSubjects, useAdminChapters } from "../hooks/useContent";
import { useAdminTests, useCreateTest, useUpdateTest, usePublishTest, useDuplicateTest, useTestAnalytics } from "../hooks/useTests";
import { parseQuestionsFile, downloadTemplate, type ParsedQuestion, type ParseError } from "../lib/bulkParse";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { AdminTest, ContentChapter } from "../types";

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
        <button
          onClick={onRemove}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-rose/10 transition-colors"
          aria-label={`Remove question ${index + 1}`}
        >
          <Icon name={Icons.delete} size={18} className="text-rose" aria-hidden />
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
              className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                q.correct_answer === oi
                  ? "border-teal bg-teal text-white"
                  : "border-ink/20 text-ink-3 hover:border-teal/40"
              }`}
              aria-label={`Mark option ${LABELS[oi]} as correct`}
            >
              {q.correct_answer === oi ? (
                <Icon name={Icons.check} size={16} aria-hidden />
              ) : (
                <span className="text-xs font-bold">{LABELS[oi]}</span>
              )}
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
            <Icon name={Icons.add} size={16} className="mr-1" aria-hidden />
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

// ── Bulk Upload Test Modal ────────────────────────────────────────────────────

const LABELS = ["A", "B", "C", "D"];

function BulkUploadTestModal({
  open,
  chapter,
  existingTest,
  onClose,
}: {
  open: boolean;
  chapter: ContentChapter;
  existingTest: AdminTest | undefined;
  onClose: () => void;
}) {
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const [rows, setRows] = useState<ParsedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [parseLoading, setParseLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState(existingTest?.title ?? `${chapter.title} — Test`);
  const [durationMinutes, setDurationMinutes] = useState(
    String(existingTest?.duration_minutes ?? 30)
  );

  const totalMarks = rows.reduce((s, q) => s + q.marks, 0);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseLoading(true);
    setRows([]);
    setParseErrors([]);
    try {
      const result = await parseQuestionsFile(file);
      setRows(result.rows);
      setParseErrors(result.errors);
    } catch (err: any) {
      setParseErrors([{ row: 0, message: err.message }]);
    } finally {
      setParseLoading(false);
    }
  }

  function handleSubmit() {
    if (!rows.length || !title.trim()) return;
    const payload = {
      title: title.trim(),
      duration_minutes: parseInt(durationMinutes) || 30,
      total_marks: totalMarks,
      questions: rows.map((q) => ({
        text: q.text,
        text_ml: q.text_ml,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        marks: q.marks,
      })),
    };

    if (existingTest) {
      updateTest.mutate({ id: existingTest.id, ...payload }, { onSuccess: onClose });
    } else {
      createTest.mutate(
        { chapter_id: chapter.id, ...payload },
        { onSuccess: onClose }
      );
    }
  }

  function handleClose() {
    setRows([]);
    setParseErrors([]);
    setFileName("");
    onClose();
  }

  const isPending = createTest.isPending || updateTest.isPending;
  const mutationError = createTest.error || updateTest.error;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={existingTest ? `Replace Test Questions — ${chapter.title}` : `Bulk Create Test — ${chapter.title}`}
      size="lg"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Template download */}
        <div className="flex items-center justify-between p-3 bg-bg rounded-lg border border-ink/8">
          <div>
            <p className="font-display font-semibold text-sm text-ink">Download template</p>
            <p className="text-xs text-ink-3 font-body mt-0.5">
              Columns: question_text, question_text_ml, option_a–d, correct_answer (A–D or 0–3), explanation, marks
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => downloadTemplate("questions")}>
            <Icon name={Icons.upload} size={16} className="mr-1 rotate-180" aria-hidden />
            Template
          </Button>
        </div>

        {existingTest && (
          <div className="p-3 bg-amber/10 rounded-lg border border-amber/20">
            <p className="text-xs font-body text-amber font-semibold">
              This will replace all {existingTest.questions.length} existing questions in "{existingTest.title}".
            </p>
          </div>
        )}

        {/* Test meta */}
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
            <label className="block text-sm font-semibold font-body text-ink mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* File picker */}
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">
            Upload CSV or Excel file
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-ink-3 font-body
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-semibold file:bg-teal/10 file:text-teal
              hover:file:bg-teal/20 cursor-pointer"
          />
          {fileName && !parseLoading && (
            <p className="text-xs text-ink-3 font-body mt-1">{fileName}</p>
          )}
          {parseLoading && <p className="text-xs text-ink-3 font-body mt-1">Parsing file…</p>}
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-rose/5 rounded-lg border border-rose/20 space-y-1">
            {parseErrors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs font-body text-rose">
                {e.row > 0 ? `Row ${e.row}: ` : ""}{e.message}
              </p>
            ))}
            {parseErrors.length > 5 && (
              <p className="text-xs font-body text-rose">…and {parseErrors.length - 5} more errors</p>
            )}
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold font-body text-ink">
              Preview — {rows.length} question{rows.length !== 1 ? "s" : ""} · {totalMarks} marks total
            </p>
            {rows.slice(0, 5).map((q, i) => (
              <div key={i} className="bg-bg rounded-lg border border-ink/8 p-3 space-y-2">
                <p className="text-sm font-body text-ink">
                  <span className="font-bold text-teal mr-2">Q{i + 1}</span>
                  {q.text}
                </p>
                <div className="grid grid-cols-2 gap-1.5 pl-6">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-body ${
                        q.correct_answer === oi
                          ? "bg-teal/10 text-teal font-semibold"
                          : "text-ink"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        q.correct_answer === oi ? "bg-teal text-white" : "bg-ink/8 text-ink-3"
                      }`}>
                        {LABELS[oi]}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {rows.length > 5 && (
              <p className="text-xs text-ink-3 font-body text-center">
                …and {rows.length - 5} more questions
              </p>
            )}
          </div>
        )}

        {mutationError && (
          <p className="text-sm text-rose font-body">
            {(mutationError as any)?.response?.data?.detail ?? "Failed to save test"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-ink/8 sticky bottom-0 bg-white py-3">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!rows.length || !title.trim() || isPending}
            loading={isPending}
            onClick={handleSubmit}
          >
            {existingTest ? "Replace Questions" : `Create Test (${rows.length} questions)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Test Modal ───────────────────────────────────────────────────────────

function EditTestModal({
  open,
  test,
  onClose,
}: {
  open: boolean;
  test: AdminTest;
  onClose: () => void;
}) {
  const updateTest = useUpdateTest();
  const [title, setTitle] = useState(test.title);
  const [durationMinutes, setDurationMinutes] = useState(String(test.duration_minutes));
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    test.questions.map((q) => ({
      text: q.text,
      text_ml: q.text_ml,
      options: q.options as [string, string, string, string],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      marks: q.marks,
    }))
  );

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  function handleSubmit() {
    if (!title.trim() || questions.length === 0) return;
    const valid = questions.every(
      (q) => q.text.trim() && q.options.every((o) => o.trim())
    );
    if (!valid) return;

    updateTest.mutate(
      {
        id: test.id,
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
    <Modal open={open} onClose={onClose} title={`Edit Test — ${test.title}`} size="lg">
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
          <Button size="sm" variant="secondary" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
            <Icon name={Icons.add} size={16} className="mr-1" aria-hidden />
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

        {updateTest.error && (
          <p className="text-sm text-rose font-body">
            {(updateTest.error as any)?.response?.data?.detail ?? "Failed to update test"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-ink/8 sticky bottom-0 bg-white py-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!title.trim() || questions.length === 0 || updateTest.isPending}
            loading={updateTest.isPending}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Analytics Drawer ──────────────────────────────────────────────────────────

function AnalyticsDrawer({ testId, testTitle, open, onClose }: {
  testId: string | null;
  testTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: analytics, isLoading } = useTestAnalytics(testId ?? undefined);

  function correctRateColor(rate: number) {
    if (rate >= 70) return "#16a34a";
    if (rate >= 40) return "#f59e0b";
    return "#e11d48";
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl transition-transform overflow-y-auto ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8 sticky top-0 bg-white z-10">
          <h3 className="font-display font-bold text-lg text-ink">Test Analytics</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink/5" aria-label="Close">
            <Icon name={Icons.close} size={20} className="text-ink-3" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="font-body text-sm text-ink-3 truncate">{testTitle}</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !analytics ? null : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-ink">{analytics.attempt_count}</p>
                  <p className="text-xs text-ink-3 font-body">Attempts</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-teal">{analytics.avg_score_pct}%</p>
                  <p className="text-xs text-ink-3 font-body">Avg Score</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className={`text-xl font-display font-bold ${analytics.pass_rate >= 50 ? "text-forest" : "text-rose"}`}>
                    {analytics.pass_rate}%
                  </p>
                  <p className="text-xs text-ink-3 font-body">Pass Rate</p>
                </div>
              </div>

              {/* Per-question breakdown */}
              {analytics.question_analytics.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-ink mb-4">Question Breakdown</h4>
                  <div className="space-y-5">
                    {analytics.question_analytics.map((q) => {
                      const totalAnswers = Object.values(q.option_distribution).reduce((s, v) => s + v, 0);
                      return (
                        <div key={q.question_index} className="border border-ink/8 rounded-xl p-4 space-y-3">
                          <p className="font-body text-sm text-ink">
                            <span className="font-bold text-teal mr-2">Q{q.question_index + 1}.</span>
                            {q.question_text.length > 120 ? q.question_text.slice(0, 120) + "…" : q.question_text}
                          </p>

                          {/* Correct rate bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-body mb-1">
                              <span className="text-ink-3">Correct rate</span>
                              <span className="font-bold" style={{ color: correctRateColor(q.correct_rate) }}>
                                {q.correct_rate}%
                              </span>
                            </div>
                            <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${q.correct_rate}%`, backgroundColor: correctRateColor(q.correct_rate) }}
                              />
                            </div>
                          </div>

                          {/* Option distribution */}
                          <div className="space-y-1.5">
                            {Object.entries(q.option_distribution).map(([opt, count]) => {
                              const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                              const isCorrect = opt === q.correct_option;
                              return (
                                <div key={opt} className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    isCorrect ? "bg-teal text-white" : "bg-ink/8 text-ink-3"
                                  }`}>
                                    {opt}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${pct}%`, backgroundColor: isCorrect ? "#0D6E6E" : "#9ca3af" }}
                                    />
                                  </div>
                                  <span className="text-xs text-ink-3 w-8 text-right">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analytics.attempt_count === 0 && (
                <p className="text-sm text-ink-3 font-body text-center py-8">No attempts yet</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chapter Test Panel ────────────────────────────────────────────────────────

function ChapterTestPanel({ chapter }: { chapter: ContentChapter }) {
  const { data: test, isLoading } = useAdminTests(chapter.id);
  const publishTest = usePublishTest();
  const duplicateTest = useDuplicateTest();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-ink">{chapter.title}</h3>
        <p className="text-xs text-ink-3 font-body">Chapter {chapter.chapter_number}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : !test ? (
        <div className="flex flex-col items-center justify-center py-16 bg-bg rounded-xl border border-ink/8 gap-3">
          <p className="text-ink-3 text-sm font-body">No test for this chapter yet.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>
              <Icon name={Icons.upload} size={18} className="mr-1.5" aria-hidden />
              Bulk Upload
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name={Icons.add} size={18} className="mr-1.5" aria-hidden />
              Create Test
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Test header */}
          <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold text-base text-ink">{test.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-body text-sm text-ink-3">
                    {test.duration_minutes} min · {test.total_marks} marks · {test.questions.length} questions
                  </span>
                  <Badge variant={test.is_published ? "forest" : "gray"}>
                    {test.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAnalyticsOpen(true)}
                >
                  <Icon name={Icons.rank} size={16} className="mr-1" aria-hidden />
                  Analytics
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={duplicateTest.isPending}
                  onClick={() => duplicateTest.mutate(test.id, {
                    onSuccess: () => toast.success("Test duplicated"),
                    onError: () => toast.error("Duplicate failed"),
                  })}
                >
                  <Icon name={Icons.copy} size={16} className="mr-1" aria-hidden />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setBulkOpen(true)}
                >
                  <Icon name={Icons.upload} size={16} className="mr-1" aria-hidden />
                  Bulk
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditOpen(true)}
                >
                  <Icon name={Icons.edit} size={16} className="mr-1" aria-hidden />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => publishTest.mutate(test.id)}
                  disabled={publishTest.isPending}
                >
                  {test.is_published ? (
                    <>
                      <Icon name={Icons.visibilityOff} size={16} className="mr-1" aria-hidden />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Icon name={Icons.visibility} size={16} className="mr-1" aria-hidden />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Questions list */}
          {test.questions.length > 0 && (
            <div className="space-y-3">
              {test.questions.map((q, i) => {
                const LABELS = ["A", "B", "C", "D"];
                return (
                  <div key={q.id} className="bg-bg rounded-xl border border-ink/8 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="font-body text-sm text-ink leading-relaxed">{q.text}</p>
                      </div>
                      <span className="text-xs font-semibold font-body text-ink-3 whitespace-nowrap flex-shrink-0">
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-8">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body ${
                            q.correct_answer === oi
                              ? "border-teal bg-teal/8 text-teal font-semibold"
                              : "border-ink/10 text-ink"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              q.correct_answer === oi
                                ? "bg-teal text-white"
                                : "bg-ink/8 text-ink-3"
                            }`}
                          >
                            {LABELS[oi]}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="pl-8 text-xs font-body text-ink-3 italic">
                        <span className="not-italic font-semibold text-amber">Explanation:</span>{" "}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <CreateTestModal
        open={createOpen}
        chapter={chapter}
        onClose={() => setCreateOpen(false)}
      />
      {test && editOpen && (
        <EditTestModal
          open={editOpen}
          test={test}
          onClose={() => setEditOpen(false)}
        />
      )}
      <BulkUploadTestModal
        open={bulkOpen}
        chapter={chapter}
        existingTest={test}
        onClose={() => setBulkOpen(false)}
      />
      <AnalyticsDrawer
        testId={test?.id ?? null}
        testTitle={test?.title ?? ""}
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
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
                  <Icon name={Icons.forward} size={16} className="opacity-40 flex-shrink-0" aria-hidden />
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
