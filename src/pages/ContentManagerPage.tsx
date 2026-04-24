import { useState } from "react";
import { ChevronRight, Plus, Eye, EyeOff } from "lucide-react";
import {
  useAdminSubjects,
  useAdminChapters,
  useAdminLessons,
  useCreateLesson,
  useUploadNotes,
} from "../hooks/useContent";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { FileUpload } from "../components/ui/FileUpload";
import { Skeleton } from "../components/ui/Skeleton";
import api from "../api/axios";
import type { ContentChapter, ContentLesson } from "../types";

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
            className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Title (Malayalam)</label>
          <input
            type="text"
            value={form.title_ml}
            onChange={(e) => setForm((f) => ({ ...f, title_ml: e.target.value }))}
            placeholder="Malayalam title"
            className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">YouTube Video ID</label>
          <input
            type="text"
            value={form.youtube_video_id}
            onChange={(e) => setForm((f) => ({ ...f, youtube_video_id: e.target.value }))}
            placeholder="e.g. dQw4w9WgXcQ"
            className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold font-body text-ink mb-1">Duration (seconds)</label>
          <input
            type="number"
            value={form.duration_seconds}
            onChange={(e) => setForm((f) => ({ ...f, duration_seconds: e.target.value }))}
            placeholder="e.g. 720"
            className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
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
            className="w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal"
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

// ── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson }: { lesson: ContentLesson }) {
  const [toggling, setToggling] = useState(false);

  async function togglePublish() {
    setToggling(true);
    try {
      await api.patch(`/admin/lessons/${lesson.id}/publish`);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-bg transition-colors">
      <div className="flex-1 min-w-0">
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
      <button
        onClick={togglePublish}
        disabled={toggling}
        className="p-1.5 rounded-lg hover:bg-ink/5 transition-colors"
        title={lesson.is_published ? "Unpublish" : "Publish"}
      >
        {lesson.is_published ? (
          <Eye size={16} className="text-teal" />
        ) : (
          <EyeOff size={16} className="text-ink-3" />
        )}
      </button>
    </div>
  );
}

// ── Lessons Panel ─────────────────────────────────────────────────────────────

function LessonsPanel({ chapter }: { chapter: ContentChapter }) {
  const { data, isLoading } = useAdminLessons(chapter.id);
  const [addOpen, setAddOpen] = useState(false);
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
            Upload Notes
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            Lesson
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

      <AddLessonModal
        open={addOpen}
        chapterId={chapter.id}
        onClose={() => setAddOpen(false)}
      />
      <UploadNotesModal
        open={notesOpen}
        chapterId={chapter.id}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ContentManagerPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ContentChapter | null>(null);

  const { data: subjects, isLoading: subjectsLoading } = useAdminSubjects();
  const { data: subjectDetail, isLoading: chaptersLoading } = useAdminChapters(
    selectedSubjectId ?? undefined
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Content Manager</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Manage subjects, chapters, and lessons</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-13rem)] overflow-hidden">
        {/* Column 1: Subjects */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8">
            <p className="font-display font-bold text-sm text-ink">Subjects</p>
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
                  <ChevronRight size={14} className="flex-shrink-0 opacity-40" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Chapters */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/8">
            <p className="font-display font-bold text-sm text-ink">
              {subjectDetail?.name ?? "Chapters"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {!selectedSubjectId ? (
              <p className="text-center text-ink-3 text-sm font-body py-8">
                Select a subject
              </p>
            ) : chaptersLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
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
                  {!chapter.is_published && (
                    <EyeOff size={12} className="flex-shrink-0 text-ink-3" />
                  )}
                </button>
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
    </div>
  );
}
