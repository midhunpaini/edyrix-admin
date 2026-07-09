import { useEffect, useMemo, useRef, useState } from "react";
import { useBoards } from "../hooks/useBoards";
import { useContentTree } from "../hooks/useContentTree";
import {
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
import {
  useContentItems,
  useCreateVideoItem,
  useUpdateContentItem,
  useDeleteContentItem,
  useReorderContentItems,
} from "../hooks/useContentItems";
import { useCreateTopic, useUpdateTopic, useDeleteTopic } from "../hooks/useTopics";
import {
  useContentItemTimestamps,
  useCreateTimestamp,
  useDeleteTimestamp,
} from "../hooks/useLessonTimestamps";
import { parseLessonsFile, downloadTemplate, type ParsedLesson, type ParseError } from "../lib/bulkParse";
import { parseYoutubeId, thumbnailUrl, fetchOembedTitle } from "../lib/youtube";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { ContentItem, TreeChapter, TreeClass, TreeLesson, TreeSubject } from "../types";

const INPUT_CLS =
  "w-full h-9 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal";
const BOARD_KEY = "studyvek_admin_content_board";

// ── Status dot (single Draft/Published vocabulary) ─────────────────────────────

function StatusDot({ published }: { published: boolean }) {
  return (
    <span
      title={published ? "Published" : "Draft"}
      className={`w-2 h-2 rounded-full flex-shrink-0 ${published ? "bg-teal" : "border-[1.5px] border-ink/30"}`}
    />
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────────

function AddSubjectModal({ open, boardId, defaultClass, onClose }: { open: boolean; boardId: string; defaultClass: number; onClose: () => void }) {
  const createSubject = useCreateSubject();
  const [form, setForm] = useState({ name: "", name_ml: "", slug: "", class_number: String(defaultClass), icon: "SUB", color: "#0D6E6E", monthly_price_paise: "24900" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) setForm((f) => ({ ...f, class_number: String(defaultClass) })); }, [open, defaultClass]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    createSubject.mutate(
      { board_id: boardId, name: form.name.trim(), name_ml: form.name_ml.trim() || form.name.trim(), slug: form.slug.trim(), class_number: parseInt(form.class_number) || 10, icon: form.icon.trim() || "SUB", color: form.color, monthly_price_paise: parseInt(form.monthly_price_paise) || 0 },
      { onSuccess: onClose, onError: (e: any) => setError(e?.response?.data?.detail ?? "Failed") }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Subject" size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Name</label><input value={form.name} onChange={set("name")} className={INPUT_CLS} /></div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Name (ML)</label><input value={form.name_ml} onChange={set("name_ml")} className={INPUT_CLS} /></div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Slug</label><input value={form.slug} onChange={set("slug")} placeholder="physics-10" className={INPUT_CLS} /></div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Class</label><input type="number" min={7} max={10} value={form.class_number} onChange={set("class_number")} className={INPUT_CLS} /></div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Icon</label><input value={form.icon} onChange={set("icon")} className={INPUT_CLS} /></div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Colour</label><input type="color" value={form.color} onChange={set("color")} className="w-full h-9 rounded-lg border border-ink/20" /></div>
          <div className="col-span-2"><label className="block text-xs font-semibold font-body text-ink mb-1">Monthly price (paise)</label><input type="number" value={form.monthly_price_paise} onChange={set("monthly_price_paise")} className={INPUT_CLS} /></div>
        </div>
        {error && <p className="text-sm text-rose font-body">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={createSubject.isPending} loading={createSubject.isPending} onClick={submit}>Create</Button></div>
      </div>
    </Modal>
  );
}

function AddChapterModal({ open, subject, onClose }: { open: boolean; subject: TreeSubject; onClose: () => void }) {
  const createChapter = useCreateChapter();
  const nextNumber = (subject.chapters.reduce((m, c) => Math.max(m, c.chapter_number), 0) + 1);
  const [form, setForm] = useState({ chapter_number: String(nextNumber), title: "", title_ml: "" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) setForm((f) => ({ ...f, chapter_number: String(nextNumber) })); }, [open, nextNumber]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function submit() {
    setError(null);
    if (!form.title.trim()) { setError("Title is required"); return; }
    createChapter.mutate(
      { subject_id: subject.id, chapter_number: parseInt(form.chapter_number) || 1, title: form.title.trim(), title_ml: form.title_ml.trim() || form.title.trim() },
      { onSuccess: onClose, onError: (e: any) => setError(e?.response?.data?.detail ?? "Failed") }
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="Add Chapter" size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Chapter number</label><input type="number" value={form.chapter_number} onChange={set("chapter_number")} className={INPUT_CLS} /></div>
          <div /><div className="col-span-2"><label className="block text-xs font-semibold font-body text-ink mb-1">Title</label><input value={form.title} onChange={set("title")} className={INPUT_CLS} /></div>
          <div className="col-span-2"><label className="block text-xs font-semibold font-body text-ink mb-1">Title (ML)</label><input value={form.title_ml} onChange={set("title_ml")} className={INPUT_CLS} /></div>
        </div>
        {error && <p className="text-sm text-rose font-body">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={createChapter.isPending} loading={createChapter.isPending} onClick={submit}>Create</Button></div>
      </div>
    </Modal>
  );
}

function LessonModal({ open, chapterId, existing, onClose }: { open: boolean; chapterId: string; existing: TreeLesson | null; onClose: () => void }) {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [isFree, setIsFree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPending = createLesson.isPending || updateLesson.isPending;
  function submit() {
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    const onErr = (e: any) => setError(e?.response?.data?.detail ?? "Failed");
    if (existing) updateLesson.mutate({ id: existing.id, chapter_id: chapterId, title: title.trim() }, { onSuccess: onClose, onError: onErr });
    else createLesson.mutate({ chapter_id: chapterId, title: title.trim(), title_ml: title.trim(), is_free: isFree }, { onSuccess: onClose, onError: onErr });
  }
  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit Lesson" : "Add Lesson"} size="md">
      <div className="space-y-3">
        <div><label className="block text-xs font-semibold font-body text-ink mb-1">Lesson title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLS} /></div>
        {!existing && <label className="flex items-center gap-2 font-body text-sm text-ink"><input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />Free lesson</label>}
        <p className="text-xs text-ink-3 font-body">A lesson is a container — add video/notes/test items after creating.</p>
        {error && <p className="text-sm text-rose font-body">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={isPending} loading={isPending} onClick={submit}>{existing ? "Save" : "Create"}</Button></div>
      </div>
    </Modal>
  );
}

function VideoItemModal({ open, lessonId, existing, onClose }: { open: boolean; lessonId: string; existing: ContentItem | null; onClose: () => void }) {
  const createVideo = useCreateVideoItem();
  const updateItem = useUpdateContentItem();
  const [url, setUrl] = useState(existing?.youtube_video_id ?? "");
  const [videoId, setVideoId] = useState(existing?.youtube_video_id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [duration, setDuration] = useState(existing?.duration_seconds ? String(existing.duration_seconds) : "");
  const [thumb, setThumb] = useState(existing?.thumbnail_url ?? "");
  const [isFree, setIsFree] = useState(existing?.is_free ?? false);
  const [error, setError] = useState<string | null>(null);
  const isPending = createVideo.isPending || updateItem.isPending;

  async function onUrlResolve(value: string) {
    const id = parseYoutubeId(value);
    if (!id) return;
    setVideoId(id);
    setThumb(thumbnailUrl(id));
    if (!title.trim()) {
      const t = await fetchOembedTitle(id); // best-effort (public only)
      if (t) setTitle(t);
    }
  }

  function submit() {
    setError(null);
    const id = videoId || parseYoutubeId(url);
    if (!title.trim() || !id) { setError("Title and a valid YouTube URL/ID are required"); return; }
    const dur = duration ? Number(duration) : null;
    const onErr = (e: any) => setError(e?.response?.data?.detail ?? "Failed");
    if (existing) updateItem.mutate({ id: existing.id, lesson_id: lessonId, title: title.trim(), youtube_video_id: id, duration_seconds: dur, thumbnail_url: thumb || null, is_free: isFree }, { onSuccess: onClose, onError: onErr });
    else createVideo.mutate({ lesson_id: lessonId, title: title.trim(), youtube_video_id: id, duration_seconds: dur, thumbnail_url: thumb || null, is_free: isFree }, { onSuccess: onClose, onError: onErr });
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit Video" : "Add Video"} size="md">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold font-body text-ink mb-1">YouTube URL or ID</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => onUrlResolve(e.target.value)}
            onPaste={(e) => { const v = e.clipboardData.getData("text"); setTimeout(() => onUrlResolve(v), 0); }}
            placeholder="https://youtu.be/…  (auto-fills thumbnail + title)"
            className={INPUT_CLS}
          />
          {videoId && <p className="text-[11px] text-ink-3 font-body mt-1">Video id: <span className="font-mono">{videoId}</span></p>}
        </div>
        {thumb && <img src={thumb} alt="thumbnail" className="w-40 rounded-lg border border-ink/10" />}
        <div><label className="block text-xs font-semibold font-body text-ink mb-1">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLS} /></div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Duration (seconds)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={INPUT_CLS} /></div>
          <label className="flex items-center gap-2 h-9 font-body text-sm text-ink"><input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />Free</label>
        </div>
        {error && <p className="text-sm text-rose font-body">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={isPending} loading={isPending} onClick={submit}>{existing ? "Save" : "Add Video"}</Button></div>
      </div>
    </Modal>
  );
}

function TopicModal({ open, chapterId, lessonId, existing, onClose }: { open: boolean; chapterId: string; lessonId: string | null; existing: { id: string; title: string } | null; onClose: () => void }) {
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const [title, setTitle] = useState(existing?.title ?? "");
  const isPending = createTopic.isPending || updateTopic.isPending;
  function submit() {
    if (!title.trim()) return;
    if (existing) updateTopic.mutate({ id: existing.id, chapter_id: chapterId, title: title.trim() }, { onSuccess: onClose });
    else createTopic.mutate({ chapter_id: chapterId, lesson_id: lessonId, title: title.trim() }, { onSuccess: onClose });
  }
  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit Topic" : lessonId ? "Add Topic to Lesson" : "Add Chapter Topic"} size="sm">
      <div className="space-y-3">
        <div><label className="block text-xs font-semibold font-body text-ink mb-1">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLS} /></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!title.trim() || isPending} loading={isPending} onClick={submit}>{existing ? "Save" : "Add"}</Button></div>
      </div>
    </Modal>
  );
}

function UploadNotesModal({ open, chapterId, onClose }: { open: boolean; chapterId: string; onClose: () => void }) {
  const uploadNotes = useUploadNotes();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  function submit() {
    setError(null);
    if (!title.trim() || !file) { setError("Title and file required"); return; }
    uploadNotes.mutate({ chapterId, title: title.trim(), file }, { onSuccess: () => { setTitle(""); setFile(null); onClose(); }, onError: (e: any) => setError(e?.response?.data?.detail ?? "Failed") });
  }
  return (
    <Modal open={open} onClose={onClose} title="Upload Notes (PDF)" size="md">
      <div className="space-y-3">
        <div><label className="block text-xs font-semibold font-body text-ink mb-1">Notes title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLS} /></div>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-ink-3 font-body file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal/10 file:text-teal" />
        {error && <p className="text-sm text-rose font-body">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!file || !title.trim() || uploadNotes.isPending} loading={uploadNotes.isPending} onClick={submit}>Upload</Button></div>
      </div>
    </Modal>
  );
}

function BulkUploadModal({ open, chapterId, onClose }: { open: boolean; chapterId: string; onClose: () => void }) {
  const bulkCreate = useBulkCreateLessons();
  const [rows, setRows] = useState<ParsedLesson[]>([]);
  const [errs, setErrs] = useState<ParseError[]>([]);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { const r = await parseLessonsFile(f); setRows(r.rows); setErrs(r.errors); } catch (err: any) { setErrs([{ row: 0, message: err.message }]); }
  }
  function submit() { if (rows.length) bulkCreate.mutate({ chapter_id: chapterId, lessons: rows }, { onSuccess: () => { setRows([]); onClose(); } }); }
  return (
    <Modal open={open} onClose={onClose} title="Bulk Upload Lessons (video)" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-bg rounded-lg border border-ink/8"><p className="text-xs text-ink-3 font-body">Each row creates a lesson + one video content item.</p><Button size="sm" variant="secondary" onClick={() => downloadTemplate("lessons")}>Template</Button></div>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="block w-full text-sm text-ink-3 font-body file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal/10 file:text-teal" />
        {errs.length > 0 && <div className="p-3 bg-rose/5 rounded-lg border border-rose/20 space-y-1">{errs.slice(0, 5).map((e, i) => <p key={i} className="text-xs font-body text-rose">{e.row > 0 ? `Row ${e.row}: ` : ""}{e.message}</p>)}</div>}
        {rows.length > 0 && <p className="text-sm font-semibold font-body text-ink">{rows.length} lesson(s) ready</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!rows.length || bulkCreate.isPending} loading={bulkCreate.isPending} onClick={submit}>Import</Button></div>
      </div>
    </Modal>
  );
}

// ── Timestamps under a video ───────────────────────────────────────────────────

function TimestampsRow({ item, chapterTopics }: { item: ContentItem; chapterTopics: { id: string; title: string }[] }) {
  const { data: timestamps = [] } = useContentItemTimestamps(item.id);
  const createTs = useCreateTimestamp();
  const deleteTs = useDeleteTimestamp();
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState("");
  const [start, setStart] = useState(0);
  const map = Object.fromEntries(chapterTopics.map((t) => [t.id, t.title]));
  return (
    <div className="mt-2 pl-3 border-l-2 border-ink/8">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold font-body text-ink-3 uppercase tracking-wide">Timestamps · {timestamps.length}</span>
        <button onClick={() => setOpen(true)} className="text-[10px] font-body font-semibold text-teal" aria-label="Add timestamp">+ Add</button>
      </div>
      {timestamps.length > 0 && (
        <div className="space-y-0.5 mt-1">
          {timestamps.map((ts) => (
            <div key={ts.id} className="flex items-center gap-2 text-xs font-body text-ink-3 group">
              <span className="font-semibold text-ink">{map[ts.topic_id] ?? "—"}</span><span>{ts.start_seconds}s{ts.end_seconds ? `–${ts.end_seconds}s` : ""}</span>
              <button onClick={() => deleteTs.mutate({ id: ts.id, content_item_id: item.id })} className="opacity-0 group-hover:opacity-100 ml-auto" aria-label="Delete timestamp"><Icon name={Icons.close} size={12} className="text-rose" aria-hidden /></button>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Timestamp" size="sm">
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Topic</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={INPUT_CLS}><option value="">— Select —</option>{chapterTopics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
          </div>
          <div><label className="block text-xs font-semibold font-body text-ink mb-1">Start (s)</label><input type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} className={INPUT_CLS} /></div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!topicId || createTs.isPending} loading={createTs.isPending} onClick={() => createTs.mutate({ content_item_id: item.id, topic_id: topicId, start_seconds: start }, { onSuccess: () => { setOpen(false); setTopicId(""); setStart(0); } })}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Lesson workspace ───────────────────────────────────────────────────────────

function LessonWorkspace({ board, subject, chapter, lesson }: { board: string; subject: TreeSubject; chapter: TreeChapter; lesson: TreeLesson }) {
  const { data: items = [], isLoading } = useContentItems(lesson.id);
  const publishLesson = usePublishLesson();
  const deleteItem = useDeleteContentItem();
  const reorder = useReorderContentItems();
  const [addVideo, setAddVideo] = useState(false);
  const [editVideo, setEditVideo] = useState<ContentItem | null>(null);
  const videos = items.filter((i) => i.content_type === "video");
  const chapterTopics = [...chapter.topics, ...lesson.topics];

  function moveVideo(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= videos.length) return;
    const ids = videos.map((v) => v.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate({ lesson_id: lesson.id, ordered_ids: ids });
  }

  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-6">
      <p className="font-body text-xs text-ink-3 mb-1">{board} <span className="text-ink/30">›</span> {subject.name} <span className="text-ink/30">›</span> {chapter.title} <span className="text-ink/30">›</span> <span className="text-ink">{lesson.title}</span></p>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="font-display font-bold text-xl text-ink">{lesson.title}</h3>
        <button onClick={() => publishLesson.mutate({ id: lesson.id, chapter_id: chapter.id })} disabled={publishLesson.isPending} className={`px-3 h-7 rounded-full text-xs font-body font-semibold flex items-center gap-1.5 ${lesson.is_active ? "bg-teal/10 text-teal" : "bg-ink/8 text-ink-3"}`}>
          <StatusDot published={lesson.is_active} /> {lesson.is_active ? "Published" : "Draft"}
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-sm text-ink">Videos · {videos.length}</p>
          <Button size="sm" onClick={() => setAddVideo(true)}><Icon name={Icons.add} size={14} className="mr-1" aria-hidden />Add Video</Button>
        </div>
        {isLoading ? <Skeleton className="h-16 rounded-lg" /> : !videos.length ? <p className="text-xs text-ink-3 font-body py-2">No videos yet.</p> : (
          <div className="space-y-2">
            {videos.map((v, i) => (
              <div key={v.id} className="bg-bg rounded-lg border border-ink/8 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col -my-1">
                    <button onClick={() => moveVideo(i, -1)} disabled={i === 0} className="w-5 h-4 flex items-center justify-center disabled:opacity-20" aria-label="Move video up"><Icon name={Icons.collapse} size={12} className="text-ink-3" aria-hidden /></button>
                    <button onClick={() => moveVideo(i, 1)} disabled={i === videos.length - 1} className="w-5 h-4 flex items-center justify-center disabled:opacity-20" aria-label="Move video down"><Icon name={Icons.expand} size={12} className="text-ink-3" aria-hidden /></button>
                  </div>
                  {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="w-16 h-9 object-cover rounded" /> : <span className="w-16 h-9 rounded bg-ink/8 flex items-center justify-center"><Icon name={Icons.video} size={16} className="text-ink-3" aria-hidden /></span>}
                  <p className="flex-1 font-body text-sm text-ink truncate">{v.title}</p>
                  {v.is_free && <Badge variant="forest">Free</Badge>}
                  {v.duration_seconds != null && <span className="text-xs text-ink-3 font-body">{Math.round(v.duration_seconds / 60)}m</span>}
                  <a href={`https://www.youtube.com/watch?v=${v.youtube_video_id}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg hover:bg-ink/8 flex items-center justify-center" aria-label="Preview video"><Icon name={Icons.visibility} size={14} className="text-ink-3" aria-hidden /></a>
                  <button onClick={() => setEditVideo(v)} className="w-7 h-7 rounded-lg hover:bg-ink/8 flex items-center justify-center" aria-label="Edit video"><Icon name={Icons.edit} size={14} className="text-ink-3" aria-hidden /></button>
                  <button onClick={() => deleteItem.mutate({ id: v.id, lesson_id: lesson.id })} className="w-7 h-7 rounded-lg hover:bg-rose/10 flex items-center justify-center" aria-label="Delete video"><Icon name={Icons.delete} size={14} className="text-rose" aria-hidden /></button>
                </div>
                <TimestampsRow item={v} chapterTopics={chapterTopics} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href="/tests" className="block p-4 rounded-lg border border-ink/8 hover:border-teal/40 transition-colors">
          <div className="flex items-center gap-2 mb-1"><Icon name={Icons.quiz} size={16} className="text-ink-3" aria-hidden /><p className="font-display font-bold text-sm text-ink">Tests</p></div>
          <p className="text-xs text-ink-3 font-body">Managed in the Question Editor (assessments) →</p>
        </a>
        <div className="block p-4 rounded-lg border border-ink/8">
          <div className="flex items-center gap-2 mb-1"><Icon name={Icons.upload} size={16} className="text-ink-3" aria-hidden /><p className="font-display font-bold text-sm text-ink">Notes</p></div>
          <p className="text-xs text-ink-3 font-body">Uploaded per chapter — select the chapter to add notes.</p>
        </div>
      </div>

      <VideoItemModal open={addVideo} lessonId={lesson.id} existing={null} onClose={() => setAddVideo(false)} />
      {editVideo && <VideoItemModal open lessonId={lesson.id} existing={editVideo} onClose={() => setEditVideo(null)} />}
    </div>
  );
}

// ── Chapter / Subject workspace ────────────────────────────────────────────────

function ChapterWorkspace({ board, subject, chapter, onOpenLesson }: { board: string; subject: TreeSubject; chapter: TreeChapter; onOpenLesson: (l: TreeLesson) => void }) {
  const publishChapter = usePublishChapter();
  const [addLesson, setAddLesson] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [notes, setNotes] = useState(false);
  const [addTopic, setAddTopic] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-6">
      <p className="font-body text-xs text-ink-3 mb-1">{board} <span className="text-ink/30">›</span> {subject.name} <span className="text-ink/30">›</span> <span className="text-ink">{chapter.title}</span></p>
      <div className="flex items-center gap-3 mb-5">
        <h3 className="font-display font-bold text-xl text-ink">{chapter.title}</h3>
        <button onClick={() => publishChapter.mutate(chapter.id)} disabled={publishChapter.isPending} className={`px-3 h-7 rounded-full text-xs font-body font-semibold flex items-center gap-1.5 ${chapter.is_published ? "bg-teal/10 text-teal" : "bg-ink/8 text-ink-3"}`}>
          <StatusDot published={chapter.is_published} /> {chapter.is_published ? "Published" : "Draft"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <Button size="sm" onClick={() => setAddLesson(true)}><Icon name={Icons.add} size={14} className="mr-1" aria-hidden />Add Lesson</Button>
        <Button size="sm" variant="secondary" onClick={() => setBulk(true)}><Icon name={Icons.upload} size={14} className="mr-1" aria-hidden />Bulk Upload</Button>
        <Button size="sm" variant="secondary" onClick={() => setNotes(true)}><Icon name={Icons.upload} size={14} className="mr-1" aria-hidden />Upload Notes</Button>
        <Button size="sm" variant="secondary" onClick={() => setAddTopic(true)}><Icon name={Icons.add} size={14} className="mr-1" aria-hidden />Chapter Topic</Button>
      </div>

      <p className="font-display font-bold text-sm text-ink mb-2">Lessons · {chapter.lessons.length}</p>
      {chapter.lessons.length === 0 ? (
        <p className="text-xs text-ink-3 font-body py-2">No lessons yet — click <span className="font-semibold">Add Lesson</span> to create one, then open it to add videos.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {chapter.lessons.map((l) => (
            <button key={l.id} onClick={() => onOpenLesson(l)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/8 hover:border-teal/40 hover:bg-bg text-left">
              <StatusDot published={l.is_active} />
              <Icon name={Icons.lesson} size={14} className="text-ink-3" aria-hidden />
              <span className="flex-1 font-body text-sm text-ink truncate">{l.title}</span>
              <span className="text-xs text-ink-3 font-body">Open →</span>
            </button>
          ))}
        </div>
      )}
      {chapter.topics.length > 0 && <p className="text-xs text-ink-3 font-body">{chapter.topics.length} chapter-level topic(s).</p>}

      <LessonModal open={addLesson} chapterId={chapter.id} existing={null} onClose={() => setAddLesson(false)} />
      <BulkUploadModal open={bulk} chapterId={chapter.id} onClose={() => setBulk(false)} />
      <UploadNotesModal open={notes} chapterId={chapter.id} onClose={() => setNotes(false)} />
      <TopicModal open={addTopic} chapterId={chapter.id} lessonId={null} existing={null} onClose={() => setAddTopic(false)} />
    </div>
  );
}

function SubjectWorkspace({ board, subject }: { board: string; subject: TreeSubject }) {
  const [addChapter, setAddChapter] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-6">
      <p className="font-body text-xs text-ink-3 mb-1">{board} <span className="text-ink/30">›</span> <span className="text-ink">{subject.name}</span></p>
      <div className="flex items-center gap-2 mb-4"><h3 className="font-display font-bold text-xl text-ink">{subject.name}</h3><Badge variant="gray">Class {subject.class_number}</Badge><span className="text-xs text-ink-3 font-body font-mono">{subject.slug}</span></div>
      <Button size="sm" onClick={() => setAddChapter(true)}><Icon name={Icons.add} size={14} className="mr-1" aria-hidden />Add Chapter</Button>
      <AddChapterModal open={addChapter} subject={subject} onClose={() => setAddChapter(false)} />
    </div>
  );
}

// ── Tree ────────────────────────────────────────────────────────────────────────

type Sel =
  | { kind: "subject"; subject: TreeSubject }
  | { kind: "chapter"; subject: TreeSubject; chapter: TreeChapter }
  | { kind: "lesson"; subject: TreeSubject; chapter: TreeChapter; lesson: TreeLesson }
  | null;

function TreeButton({ depth, icon, dot, label, muted, selected, expandable, expanded, onToggle, onSelect, actions }: {
  depth: number; icon?: string; dot?: boolean; label: React.ReactNode; muted?: string; selected?: boolean; expandable?: boolean; expanded?: boolean; onToggle?: () => void; onSelect?: () => void; actions?: React.ReactNode;
}) {
  return (
    <div className={`group flex items-center gap-1 pr-1 rounded-lg ${selected ? "bg-teal/10" : "hover:bg-bg"}`} style={{ paddingLeft: depth * 14 + 4 }}>
      {expandable ? (
        <button onClick={onToggle} className="w-5 h-5 flex items-center justify-center flex-shrink-0" aria-label={expanded ? "Collapse" : "Expand"}>
          <Icon name={expanded ? Icons.collapse : Icons.expand} size={14} className="text-ink-3" aria-hidden />
        </button>
      ) : <span className="w-5 flex-shrink-0" />}
      {dot !== undefined && <StatusDot published={dot} />}
      {icon && <Icon name={icon} size={14} className="text-ink-3 flex-shrink-0" aria-hidden />}
      <button onClick={onSelect} className="flex-1 min-w-0 text-left py-1.5">
        <span className={`font-body text-sm truncate block ${selected ? "text-teal font-semibold" : "text-ink"}`}>{label}{muted && <span className="ml-1.5 text-[10px] text-ink-3 font-mono">{muted}</span>}</span>
      </button>
      <div className="flex items-center gap-0.5 flex-shrink-0 text-ink-3">{actions}</div>
    </div>
  );
}

function IconBtn({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`w-6 h-6 rounded flex items-center justify-center ${danger ? "hover:bg-rose/10" : "hover:bg-ink/10"}`} aria-label={label} title={label}>
      <Icon name={icon} size={13} className={danger ? "text-rose" : "text-ink-3"} aria-hidden />
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────────

export function ContentManagerPage() {
  const { data: boards = [] } = useBoards();
  const [boardId, setBoardId] = useState<string | null>(() => localStorage.getItem(BOARD_KEY));
  const activeBoard = boardId && boards.some((b) => b.id === boardId) ? boardId : boards[0]?.id ?? null;
  useEffect(() => { if (activeBoard) localStorage.setItem(BOARD_KEY, activeBoard); }, [activeBoard]);
  const boardName = boards.find((b) => b.id === activeBoard)?.name ?? "";

  const { data: tree = [], isLoading } = useContentTree(activeBoard ?? undefined);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Sel>(null);
  const [search, setSearch] = useState("");
  const [addSubjectClass, setAddSubjectClass] = useState<number | null>(null);
  const [modal, setModal] = useState<null
    | { kind: "chapter"; subject: TreeSubject }
    | { kind: "lesson"; chapterId: string }
    | { kind: "topic"; chapterId: string; lessonId: string }
    | { kind: "editLesson"; chapterId: string; lesson: TreeLesson }
    | { kind: "editTopic"; chapterId: string; topic: { id: string; title: string } }>(null);

  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const expand = (id: string) => setExpanded((s) => new Set(s).add(id));

  // Auto-expand the whole tree once per board so lessons/topics are visible by default.
  const expandedBoardRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeBoard || !tree.length || expandedBoardRef.current === activeBoard) return;
    expandedBoardRef.current = activeBoard;
    const ids = new Set<string>();
    for (const cls of tree) {
      ids.add(`class-${cls.class_number}`);
      for (const s of cls.subjects) {
        ids.add(s.id);
        for (const c of s.chapters) { ids.add(c.id); for (const l of c.lessons) ids.add(l.id); }
      }
    }
    setExpanded(ids);
  }, [activeBoard, tree]);

  const deleteLesson = useDeleteLesson();
  const deleteTopic = useDeleteTopic();

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out: { label: string; sub: TreeSubject; ch: TreeChapter; ls?: TreeLesson }[] = [];
    for (const cls of tree) for (const sub of cls.subjects) for (const ch of sub.chapters) {
      if (ch.title.toLowerCase().includes(q)) out.push({ label: `${sub.name} › ${ch.title}`, sub, ch });
      for (const ls of ch.lessons) if (ls.title.toLowerCase().includes(q)) out.push({ label: `${ch.title} › ${ls.title}`, sub, ch, ls });
    }
    return out.slice(0, 12);
  }, [search, tree]);

  function jumpTo(sub: TreeSubject, ch: TreeChapter, ls?: TreeLesson) {
    setExpanded((s) => new Set([...s, `class-${sub.class_number}`, sub.id, ch.id]));
    setSel(ls ? { kind: "lesson", subject: sub, chapter: ch, lesson: ls } : { kind: "chapter", subject: sub, chapter: ch });
    setSearch("");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">Content</h2>
          <div className="inline-flex bg-bg rounded-lg p-0.5 border border-ink/8">
            {boards.map((b) => (
              <button key={b.id} onClick={() => setBoardId(b.id)} className={`px-3 h-8 rounded-md text-sm font-body font-semibold transition-colors ${activeBoard === b.id ? "bg-white text-teal shadow-sm" : "text-ink-3 hover:text-ink"}`}>{b.name}</button>
            ))}
          </div>
        </div>
        <div className="relative w-72">
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-ink/20 bg-white">
            <Icon name={Icons.search} size={16} className="text-ink-3" aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chapters & lessons…" className="flex-1 text-sm font-body text-ink outline-none bg-transparent" aria-label="Search content" />
          </div>
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-ink/10 shadow-lg max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => jumpTo(r.sub, r.ch, r.ls)} className="w-full text-left px-3 py-2 hover:bg-bg flex items-center gap-2">
                  <Icon name={r.ls ? Icons.lesson : Icons.chapter} size={14} className="text-ink-3" aria-hidden />
                  <span className="font-body text-sm text-ink truncate">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Tree rail */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-3 py-2.5 border-b border-ink/8 flex items-center justify-between">
            <p className="font-display font-bold text-sm text-ink">{boardName || "Content"}</p>
            <button onClick={() => setAddSubjectClass(10)} disabled={!activeBoard} className="w-7 h-7 rounded-lg hover:bg-bg flex items-center justify-center disabled:opacity-40" aria-label="Add subject"><Icon name={Icons.add} size={16} className="text-teal" aria-hidden /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {isLoading ? <div className="space-y-2 p-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}</div>
              : tree.length === 0 ? <p className="text-center text-ink-3 text-xs font-body py-8">No subjects for this board</p>
              : tree.map((cls: TreeClass) => {
                const clsId = `class-${cls.class_number}`;
                const clsOpen = expanded.has(clsId);
                return (
                  <div key={clsId}>
                    <TreeButton depth={0} label={<span className="uppercase text-[11px] tracking-wide text-ink-3 font-semibold">Class {cls.class_number}</span>} expandable expanded={clsOpen} onToggle={() => toggle(clsId)} onSelect={() => toggle(clsId)}
                      actions={<IconBtn icon={Icons.add} label="Add subject" onClick={() => setAddSubjectClass(cls.class_number)} />} />
                    {clsOpen && cls.subjects.map((sub) => {
                      const sOpen = expanded.has(sub.id);
                      return (
                        <div key={sub.id}>
                          <TreeButton depth={1} icon={Icons.subject} dot={sub.is_active} label={sub.name} muted={sub.slug} selected={sel?.kind === "subject" && sel.subject.id === sub.id} expandable expanded={sOpen} onToggle={() => toggle(sub.id)} onSelect={() => setSel({ kind: "subject", subject: sub })}
                            actions={<IconBtn icon={Icons.add} label="Add chapter" onClick={() => { expand(sub.id); setModal({ kind: "chapter", subject: sub }); }} />} />
                          {sOpen && sub.chapters.map((ch) => {
                            const cOpen = expanded.has(ch.id);
                            return (
                              <div key={ch.id}>
                                <TreeButton depth={2} icon={Icons.chapter} dot={ch.is_published} label={<>{ch.chapter_number}. {ch.title}</>} selected={sel?.kind === "chapter" && sel.chapter.id === ch.id} expandable expanded={cOpen} onToggle={() => toggle(ch.id)} onSelect={() => setSel({ kind: "chapter", subject: sub, chapter: ch })}
                                  actions={<IconBtn icon={Icons.add} label="Add lesson" onClick={() => setModal({ kind: "lesson", chapterId: ch.id })} />} />
                                {cOpen && (
                                  <>
                                    {ch.lessons.map((ls) => {
                                      const lOpen = expanded.has(ls.id);
                                      const hasTopics = ls.topics.length > 0;
                                      return (
                                        <div key={ls.id}>
                                          <TreeButton depth={3} icon={Icons.lesson} dot={ls.is_active} label={ls.title} selected={sel?.kind === "lesson" && sel.lesson.id === ls.id} expandable={hasTopics} expanded={lOpen} onToggle={() => toggle(ls.id)} onSelect={() => setSel({ kind: "lesson", subject: sub, chapter: ch, lesson: ls })}
                                            actions={<>
                                              <IconBtn icon={Icons.add} label="Add topic" onClick={() => setModal({ kind: "topic", chapterId: ch.id, lessonId: ls.id })} />
                                              <IconBtn icon={Icons.edit} label="Edit lesson" onClick={() => setModal({ kind: "editLesson", chapterId: ch.id, lesson: ls })} />
                                              <IconBtn icon={Icons.delete} label="Delete lesson" danger onClick={() => { deleteLesson.mutate({ id: ls.id, chapter_id: ch.id }); if (sel?.kind === "lesson" && sel.lesson.id === ls.id) setSel(null); }} />
                                            </>} />
                                          {lOpen && ls.topics.map((t) => (
                                            <TreeButton key={t.id} depth={4} icon={Icons.more} label={t.title} onSelect={() => {}}
                                              actions={<><IconBtn icon={Icons.edit} label="Edit topic" onClick={() => setModal({ kind: "editTopic", chapterId: ch.id, topic: t })} /><IconBtn icon={Icons.delete} label="Delete topic" danger onClick={() => deleteTopic.mutate({ id: t.id, chapter_id: ch.id })} /></>} />
                                          ))}
                                        </div>
                                      );
                                    })}
                                    {ch.topics.map((t) => (
                                      <TreeButton key={t.id} depth={3} icon={Icons.more} label={<span className="italic text-ink-3">{t.title}</span>} onSelect={() => {}}
                                        actions={<><IconBtn icon={Icons.edit} label="Edit topic" onClick={() => setModal({ kind: "editTopic", chapterId: ch.id, topic: t })} /><IconBtn icon={Icons.delete} label="Delete topic" danger onClick={() => deleteTopic.mutate({ id: t.id, chapter_id: ch.id })} /></>} />
                                    ))}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto">
          {!sel ? (
            <div className="flex items-center justify-center h-full bg-white rounded-xl border border-ink/8 shadow-sm"><p className="text-ink-3 text-sm font-body">Select a <b>chapter</b> to add lessons, or a <b>lesson</b> to add videos</p></div>
          ) : sel.kind === "lesson" ? (
            <LessonWorkspace board={boardName} subject={sel.subject} chapter={sel.chapter} lesson={sel.lesson} />
          ) : sel.kind === "chapter" ? (
            <ChapterWorkspace board={boardName} subject={sel.subject} chapter={sel.chapter} onOpenLesson={(l) => setSel({ kind: "lesson", subject: sel.subject, chapter: sel.chapter, lesson: l })} />
          ) : (
            <SubjectWorkspace board={boardName} subject={sel.subject} />
          )}
        </div>
      </div>

      {activeBoard && addSubjectClass !== null && <AddSubjectModal open boardId={activeBoard} defaultClass={addSubjectClass} onClose={() => setAddSubjectClass(null)} />}
      {modal?.kind === "chapter" && <AddChapterModal open subject={modal.subject} onClose={() => setModal(null)} />}
      {modal?.kind === "lesson" && <LessonModal open chapterId={modal.chapterId} existing={null} onClose={() => setModal(null)} />}
      {modal?.kind === "editLesson" && <LessonModal open chapterId={modal.chapterId} existing={modal.lesson} onClose={() => setModal(null)} />}
      {modal?.kind === "topic" && <TopicModal open chapterId={modal.chapterId} lessonId={modal.lessonId} existing={null} onClose={() => setModal(null)} />}
      {modal?.kind === "editTopic" && <TopicModal open chapterId={modal.chapterId} lessonId={null} existing={modal.topic} onClose={() => setModal(null)} />}
    </div>
  );
}
