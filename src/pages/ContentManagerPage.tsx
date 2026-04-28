import { useState } from "react";
import {
  useAdminSubjects,
  useAdminChapters,
  useAdminLessons,
  useCreateSubject,
  useCreateChapter,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  usePublishLesson,
  usePublishChapter,
  useUploadNotes,
  useBulkCreateLessons,
} from "../hooks/useContent";
import { parseLessonsFile, downloadTemplate, type ParsedLesson, type ParseError } from "../lib/bulkParse";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { FileUpload } from "../components/ui/FileUpload";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { ContentChapter, ContentLesson } from "../types";

const INPUT_CLS =
  "w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal";

// ── Add Subject Modal ─────────────────────────────────────────────────────────

interface SubjectForm {
  name: string;
  name_ml: string;
  slug: string;
  class_number: string;
  icon: string;
  color: string;
  monthly_price_paise: string;
  order_index: string;
}

function AddSubjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createSubject = useCreateSubject();
  const [form, setForm] = useState<SubjectForm>({
    name: "",
    name_ml: "",
    slug: "",
    class_number: "10",
    icon: "science",
    color: "#0D6E6E",
    monthly_price_paise: "14900",
    order_index: "0",
  });
  const set = (k: keyof SubjectForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit() {
    if (!form.name.trim() || !form.slug.trim()) return;
    createSubject.mutate(
      {
        name: form.name.trim(),
        name_ml: form.name_ml.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        class_number: parseInt(form.class_number),
        icon: form.icon.trim() || "science",
        color: form.color,
        monthly_price_paise: parseInt(form.monthly_price_paise) || 14900,
        order_index: parseInt(form.order_index) || 0,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ name: "", name_ml: "", slug: "", class_number: "10", icon: "science", color: "#0D6E6E", monthly_price_paise: "14900", order_index: "0" });
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Subject" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Name (English)</label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Physics" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Name (Malayalam)</label>
            <input type="text" value={form.name_ml} onChange={set("name_ml")} placeholder="e.g. ഭൗതികശാസ്ത്രം" className={INPUT_CLS} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">URL Slug</label>
            <input type="text" value={form.slug} onChange={set("slug")} placeholder="e.g. physics-10" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Class</label>
            <select value={form.class_number} onChange={set("class_number")} className={INPUT_CLS}>
              <option value="10">Class 10</option>
              <option value="9">Class 9</option>
              <option value="8">Class 8</option>
              <option value="7">Class 7</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Icon name</label>
            <input type="text" value={form.icon} onChange={set("icon")} placeholder="e.g. science" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Colour (hex)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={set("color")} className="h-9 w-10 rounded-lg border border-ink/20 cursor-pointer p-0.5" />
              <input type="text" value={form.color} onChange={set("color")} className={`${INPUT_CLS} flex-1`} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Monthly price (paise)</label>
            <input type="number" value={form.monthly_price_paise} onChange={set("monthly_price_paise")} placeholder="14900" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Order index</label>
            <input type="number" value={form.order_index} onChange={set("order_index")} placeholder="0" className={INPUT_CLS} />
          </div>
        </div>
        {createSubject.error && (
          <p className="text-sm text-rose font-body">
            {(createSubject.error as any)?.response?.data?.detail ?? "Failed to create subject"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.name.trim() || !form.slug.trim() || createSubject.isPending}
            loading={createSubject.isPending}
            onClick={handleSubmit}
          >
            Create Subject
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Chapter Modal ─────────────────────────────────────────────────────────

interface ChapterForm {
  chapter_number: string;
  title: string;
  title_ml: string;
  description: string;
  order_index: string;
}

function AddChapterModal({
  open,
  subjectId,
  nextChapterNumber,
  onClose,
}: {
  open: boolean;
  subjectId: string;
  nextChapterNumber: number;
  onClose: () => void;
}) {
  const createChapter = useCreateChapter();
  const [form, setForm] = useState<ChapterForm>({
    chapter_number: String(nextChapterNumber),
    title: "",
    title_ml: "",
    description: "",
    order_index: String(nextChapterNumber - 1),
  });
  const set = (k: keyof ChapterForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit() {
    if (!form.title.trim()) return;
    createChapter.mutate(
      {
        subject_id: subjectId,
        chapter_number: parseInt(form.chapter_number) || nextChapterNumber,
        title: form.title.trim(),
        title_ml: form.title_ml.trim(),
        description: form.description.trim() || undefined,
        order_index: parseInt(form.order_index) || 0,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ chapter_number: "", title: "", title_ml: "", description: "", order_index: "" });
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Chapter" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Chapter number</label>
            <input type="number" value={form.chapter_number} onChange={set("chapter_number")} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Order index</label>
            <input type="number" value={form.order_index} onChange={set("order_index")} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (English)</label>
          <input type="text" value={form.title} onChange={set("title")} placeholder="e.g. Laws of Motion" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (Malayalam)</label>
          <input type="text" value={form.title_ml} onChange={set("title_ml")} placeholder="Malayalam title" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Description (optional)</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={set("description")}
            placeholder="Brief chapter description"
            className="w-full px-3 py-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none"
          />
        </div>
        {createChapter.error && (
          <p className="text-sm text-rose font-body">
            {(createChapter.error as any)?.response?.data?.detail ?? "Failed to create chapter"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.title.trim() || createChapter.isPending}
            loading={createChapter.isPending}
            onClick={handleSubmit}
          >
            Create Chapter
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Lesson Modal ──────────────────────────────────────────────────────────

interface AddLessonForm {
  title: string;
  title_ml: string;
  youtube_video_id: string;
  duration_seconds: string;
  is_free: boolean;
}

function AddLessonModal({
  open,
  chapterId,
  onClose,
}: {
  open: boolean;
  chapterId: string;
  onClose: () => void;
}) {
  const createLesson = useCreateLesson();
  const [form, setForm] = useState<AddLessonForm>({
    title: "",
    title_ml: "",
    youtube_video_id: "",
    duration_seconds: "",
    is_free: false,
  });

  function handleSubmit() {
    if (!form.title.trim() || !form.youtube_video_id.trim()) return;
    createLesson.mutate(
      {
        chapter_id: chapterId,
        title: form.title.trim(),
        title_ml: form.title_ml.trim(),
        youtube_video_id: form.youtube_video_id.trim(),
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
        is_free: form.is_free,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ title: "", title_ml: "", youtube_video_id: "", duration_seconds: "", is_free: false });
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Lesson" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (English)</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Introduction to Gravitation"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (Malayalam)</label>
          <input
            type="text"
            value={form.title_ml}
            onChange={(e) => setForm((f) => ({ ...f, title_ml: e.target.value }))}
            placeholder="Malayalam title"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">YouTube Video ID</label>
          <input
            type="text"
            value={form.youtube_video_id}
            onChange={(e) => setForm((f) => ({ ...f, youtube_video_id: e.target.value }))}
            placeholder="e.g. dQw4w9WgXcQ"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Duration (seconds)</label>
          <input
            type="number"
            value={form.duration_seconds}
            onChange={(e) => setForm((f) => ({ ...f, duration_seconds: e.target.value }))}
            placeholder="e.g. 720"
            className={INPUT_CLS}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))}
            className="w-4 h-4 accent-teal"
          />
          <span className="text-sm font-body text-ink">Free lesson (accessible without subscription)</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.title.trim() || !form.youtube_video_id.trim() || createLesson.isPending}
            loading={createLesson.isPending}
            onClick={handleSubmit}
          >
            Add Lesson
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Upload Notes Modal ────────────────────────────────────────────────────────

function UploadNotesModal({
  open,
  chapterId,
  onClose,
}: {
  open: boolean;
  chapterId: string;
  onClose: () => void;
}) {
  const uploadNotes = useUploadNotes();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  function handleSubmit() {
    if (!file || !title.trim()) return;
    uploadNotes.mutate(
      { chapterId, title: title.trim(), file, is_premium: true },
      {
        onSuccess: () => {
          onClose();
          setFile(null);
          setTitle("");
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Notes (PDF)" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Notes Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 5 — Gravitation Notes"
            className={INPUT_CLS}
          />
        </div>
        <FileUpload onFile={setFile} selectedFile={file} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!file || !title.trim() || uploadNotes.isPending}
            loading={uploadNotes.isPending}
            onClick={handleSubmit}
          >
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Bulk Upload Lessons Modal ─────────────────────────────────────────────────

function BulkUploadLessonsModal({
  open,
  chapterId,
  onClose,
}: {
  open: boolean;
  chapterId: string;
  onClose: () => void;
}) {
  const bulkCreate = useBulkCreateLessons();
  const [rows, setRows] = useState<ParsedLesson[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [parseLoading, setParseLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseLoading(true);
    setRows([]);
    setParseErrors([]);
    try {
      const result = await parseLessonsFile(file);
      setRows(result.rows);
      setParseErrors(result.errors);
    } catch (err: any) {
      setParseErrors([{ row: 0, message: err.message }]);
    } finally {
      setParseLoading(false);
    }
  }

  function handleSubmit() {
    if (!rows.length) return;
    bulkCreate.mutate(
      { chapter_id: chapterId, lessons: rows },
      {
        onSuccess: (data) => {
          if (data.errors.length === 0) {
            onClose();
          } else {
            setParseErrors(data.errors.map((msg, i) => ({ row: i, message: msg })));
          }
        },
      }
    );
  }

  function handleClose() {
    setRows([]);
    setParseErrors([]);
    setFileName("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Upload Lessons" size="lg">
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center justify-between p-3 bg-bg rounded-lg border border-ink/8">
          <div>
            <p className="font-display font-semibold text-sm text-ink">Download template</p>
            <p className="text-xs text-ink-3 font-body mt-0.5">
              CSV or Excel — columns: title, title_ml, youtube_video_id, duration_seconds, is_free, order_index
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => downloadTemplate("lessons")}>
            <Icon name={Icons.upload} size={16} className="mr-1 rotate-180" aria-hidden />
            Template
          </Button>
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
          {parseLoading && (
            <p className="text-xs text-ink-3 font-body mt-1">Parsing file…</p>
          )}
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

        {/* Preview table */}
        {rows.length > 0 && (
          <div>
            <p className="text-sm font-semibold font-body text-ink mb-2">
              Preview — {rows.length} lesson{rows.length !== 1 ? "s" : ""} ready to import
            </p>
            <div className="overflow-x-auto rounded-lg border border-ink/8">
              <table className="w-full text-xs font-body">
                <thead className="bg-bg">
                  <tr>
                    <th className="text-left px-3 py-2 text-ink-3 font-semibold">#</th>
                    <th className="text-left px-3 py-2 text-ink-3 font-semibold">Title</th>
                    <th className="text-left px-3 py-2 text-ink-3 font-semibold">Video ID</th>
                    <th className="text-left px-3 py-2 text-ink-3 font-semibold">Duration</th>
                    <th className="text-left px-3 py-2 text-ink-3 font-semibold">Free</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-bg/60">
                      <td className="px-3 py-2 text-ink-3">{i + 1}</td>
                      <td className="px-3 py-2 text-ink max-w-[160px] truncate">{r.title}</td>
                      <td className="px-3 py-2 text-ink-3 font-mono">{r.youtube_video_id}</td>
                      <td className="px-3 py-2 text-ink-3">
                        {r.duration_seconds ? `${Math.round(r.duration_seconds / 60)}m` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.is_free ? (
                          <Badge variant="forest">Free</Badge>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <p className="text-center text-xs text-ink-3 font-body py-2 border-t border-ink/8">
                  …and {rows.length - 10} more rows
                </p>
              )}
            </div>
          </div>
        )}

        {bulkCreate.error && (
          <p className="text-sm text-rose font-body">
            {(bulkCreate.error as any)?.response?.data?.detail ?? "Upload failed"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!rows.length || bulkCreate.isPending}
            loading={bulkCreate.isPending}
            onClick={handleSubmit}
          >
            Import {rows.length > 0 ? `${rows.length} Lesson${rows.length !== 1 ? "s" : ""}` : "Lessons"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Lesson Modal ─────────────────────────────────────────────────────────

function EditLessonModal({
  open,
  lesson,
  onClose,
}: {
  open: boolean;
  lesson: ContentLesson;
  onClose: () => void;
}) {
  const updateLesson = useUpdateLesson();
  const [form, setForm] = useState({
    title: lesson.title,
    title_ml: lesson.title_ml,
    youtube_video_id: lesson.youtube_video_id,
    duration_seconds: lesson.duration_seconds ? String(lesson.duration_seconds) : "",
    is_free: lesson.is_free,
  });

  function handleSubmit() {
    if (!form.title.trim() || !form.youtube_video_id.trim()) return;
    updateLesson.mutate(
      {
        id: lesson.id,
        chapter_id: lesson.chapter_id,
        title: form.title.trim(),
        title_ml: form.title_ml.trim(),
        youtube_video_id: form.youtube_video_id.trim(),
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
        is_free: form.is_free,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Lesson" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (English)</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (Malayalam)</label>
          <input
            type="text"
            value={form.title_ml}
            onChange={(e) => setForm((f) => ({ ...f, title_ml: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">YouTube Video ID</label>
          <input
            type="text"
            value={form.youtube_video_id}
            onChange={(e) => setForm((f) => ({ ...f, youtube_video_id: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Duration (seconds)</label>
          <input
            type="number"
            value={form.duration_seconds}
            onChange={(e) => setForm((f) => ({ ...f, duration_seconds: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))}
            className="w-4 h-4 accent-teal"
          />
          <span className="text-sm font-body text-ink">Free lesson (accessible without subscription)</span>
        </label>
        {updateLesson.error && (
          <p className="text-sm text-rose font-body">
            {(updateLesson.error as any)?.response?.data?.detail ?? "Failed to update lesson"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.title.trim() || !form.youtube_video_id.trim() || updateLesson.isPending}
            loading={updateLesson.isPending}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson }: { lesson: ContentLesson }) {
  const publishLesson = usePublishLesson();
  const deleteLesson = useDeleteLesson();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 py-2 px-2 rounded-lg hover:bg-bg transition-colors group">
        <div className="flex-1 min-w-0 px-1">
          <p className="font-body text-sm text-ink truncate">{lesson.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {lesson.is_free && <Badge variant="forest">Free</Badge>}
            {lesson.duration_seconds && (
              <span className="text-xs text-ink-3 font-body">
                {Math.round(lesson.duration_seconds / 60)}m
              </span>
            )}
          </div>
        </div>

        {/* Edit */}
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-ink/8 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Edit lesson"
        >
          <Icon name={Icons.edit} size={16} className="text-ink-3" aria-hidden />
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-rose/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete lesson"
        >
          <Icon name={Icons.delete} size={16} className="text-rose" aria-hidden />
        </button>

        {/* Publish toggle */}
        <button
          onClick={() => publishLesson.mutate({ id: lesson.id, chapter_id: lesson.chapter_id })}
          disabled={publishLesson.isPending}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-ink/8 transition-colors"
          aria-label={lesson.is_published ? "Unpublish lesson" : "Publish lesson"}
        >
          {lesson.is_published ? (
            <Icon name={Icons.visibility} size={16} className="text-teal" aria-hidden />
          ) : (
            <Icon name={Icons.visibilityOff} size={16} className="text-ink-3" aria-hidden />
          )}
        </button>
      </div>

      {editOpen && (
        <EditLessonModal open={editOpen} lesson={lesson} onClose={() => setEditOpen(false)} />
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Lesson" size="sm">
        <p className="font-body text-sm text-ink mb-4">
          Delete <span className="font-semibold">"{lesson.title}"</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleteLesson.isPending}
            loading={deleteLesson.isPending}
            onClick={() =>
              deleteLesson.mutate(
                { id: lesson.id, chapter_id: lesson.chapter_id },
                { onSuccess: () => setConfirmDelete(false) }
              )
            }
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ── Lessons Panel ─────────────────────────────────────────────────────────────

function LessonsPanel({ chapter }: { chapter: ContentChapter }) {
  const { data, isLoading } = useAdminLessons(chapter.id);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const lessons: ContentLesson[] = data ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="font-display font-bold text-base text-ink">{chapter.title}</h3>
          <p className="text-xs text-ink-3 font-body">Ch. {chapter.chapter_number}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setNotesOpen(true)}>
            <Icon name={Icons.upload} size={16} className="mr-1" aria-hidden />
            Notes
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)}>
            <Icon name={Icons.upload} size={16} className="mr-1" aria-hidden />
            Bulk
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Icon name={Icons.add} size={16} className="mr-1" aria-hidden />
            Add
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : !lessons.length ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-ink-3 text-sm font-body">No lessons yet.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {lessons.map((l) => (
            <LessonRow key={l.id} lesson={l} />
          ))}
        </div>
      )}

      <AddLessonModal open={addOpen} chapterId={chapter.id} onClose={() => setAddOpen(false)} />
      <BulkUploadLessonsModal open={bulkOpen} chapterId={chapter.id} onClose={() => setBulkOpen(false)} />
      <UploadNotesModal open={notesOpen} chapterId={chapter.id} onClose={() => setNotesOpen(false)} />
    </div>
  );
}

// ── Chapter Row ───────────────────────────────────────────────────────────────

function ChapterRow({
  chapter,
  isSelected,
  onSelect,
}: {
  chapter: ContentChapter;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const publishChapter = usePublishChapter();

  function handleTogglePublish(e: React.MouseEvent) {
    e.stopPropagation();
    publishChapter.mutate(chapter.id);
  }

  return (
    <div
      className={`flex items-center gap-1 pr-1 transition-colors ${
        isSelected ? "bg-teal/10" : "hover:bg-bg"
      }`}
    >
      <button
        onClick={onSelect}
        className={`flex-1 flex items-center gap-2 px-3 py-2.5 text-left text-sm font-body min-w-0 ${
          isSelected ? "text-teal font-semibold" : "text-ink"
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-ink/8 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {chapter.chapter_number}
        </span>
        <span className="flex-1 truncate">{chapter.title}</span>
      </button>
      <button
        onClick={handleTogglePublish}
        disabled={publishChapter.isPending}
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-ink/8 transition-colors flex-shrink-0"
        aria-label={chapter.is_published ? "Unpublish chapter" : "Publish chapter"}
      >
        {chapter.is_published ? (
          <Icon name={Icons.visibility} size={16} className="text-teal" aria-hidden />
        ) : (
          <Icon name={Icons.visibilityOff} size={16} className="text-ink-3" aria-hidden />
        )}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ContentManagerPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ContentChapter | null>(null);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [addChapterOpen, setAddChapterOpen] = useState(false);

  const { data: subjects, isLoading: subjectsLoading } = useAdminSubjects();
  const { data: subjectDetail, isLoading: chaptersLoading } = useAdminChapters(
    selectedSubjectId ?? undefined
  );

  const chapters = subjectDetail?.chapters ?? [];
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map((c) => c.chapter_number)) + 1
    : 1;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Content Manager</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Manage subjects, chapters, and lessons</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-13rem)] overflow-hidden">
        {/* Column 1: Subjects */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8 flex items-center justify-between">
            <p className="font-display font-bold text-sm text-ink">Subjects</p>
            <button
              onClick={() => setAddSubjectOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-teal/10 transition-colors"
              aria-label="Add subject"
            >
              <Icon name={Icons.add} size={18} className="text-teal" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {subjectsLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
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
                  <Icon name={Icons.forward} size={16} className="flex-shrink-0 opacity-40" aria-hidden />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Chapters */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8 flex items-center justify-between">
            <p className="font-display font-bold text-sm text-ink">
              {subjectDetail?.name ?? "Chapters"}
            </p>
            {selectedSubjectId && (
              <button
                onClick={() => setAddChapterOpen(true)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-teal/10 transition-colors"
                aria-label="Add chapter"
              >
                <Icon name={Icons.add} size={18} className="text-teal" aria-hidden />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {!selectedSubjectId ? (
              <p className="text-center text-ink-3 text-sm font-body py-8">Select a subject</p>
            ) : chaptersLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : !chapters.length ? (
              <p className="text-center text-ink-3 text-sm font-body py-8">No chapters yet.</p>
            ) : (
              chapters.map((chapter) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  isSelected={selectedChapter?.id === chapter.id}
                  onSelect={() => setSelectedChapter(chapter)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Lessons */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedChapter ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-ink-3 text-sm font-body">Select a chapter</p>
              </div>
            ) : (
              <LessonsPanel chapter={selectedChapter} />
            )}
          </div>
        </div>
      </div>

      <AddSubjectModal open={addSubjectOpen} onClose={() => setAddSubjectOpen(false)} />
      {selectedSubjectId && (
        <AddChapterModal
          open={addChapterOpen}
          subjectId={selectedSubjectId}
          nextChapterNumber={nextChapterNumber}
          onClose={() => setAddChapterOpen(false)}
        />
      )}
    </div>
  );
}
