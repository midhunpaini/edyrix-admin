import * as XLSX from "xlsx";

export interface ParsedLesson {
  title: string;
  title_ml: string;
  youtube_video_id: string;
  duration_seconds: number | null;
  is_free: boolean;
  order_index: number;
}

export interface ParsedQuestion {
  text: string;
  text_ml: string;
  options: [string, string, string, string];
  correct_answer: number;
  explanation: string;
  marks: number;
}

export interface ParseError {
  row: number;
  message: string;
}

function readSheet(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: "",
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error("Failed to parse file. Make sure it is a valid CSV or Excel file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function normaliseRow(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [normaliseHeader(k), String(v).trim()])
  );
}

export async function parseLessonsFile(file: File): Promise<{
  rows: ParsedLesson[];
  errors: ParseError[];
}> {
  const raw = await readSheet(file);
  const rows: ParsedLesson[] = [];
  const errors: ParseError[] = [];

  raw.forEach((rawRow, idx) => {
    const row = normaliseRow(rawRow);
    const rowNum = idx + 2; // 1-based + header row

    const title = row["title"] ?? "";
    const youtube_video_id = row["youtube_video_id"] ?? row["video_id"] ?? row["youtube_id"] ?? "";

    if (!title) {
      errors.push({ row: rowNum, message: "Missing required field: title" });
      return;
    }
    if (!youtube_video_id) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Missing required field: youtube_video_id` });
      return;
    }

    const durationRaw = row["duration_seconds"] ?? row["duration"] ?? "";
    const duration_seconds = durationRaw ? parseInt(durationRaw) || null : null;

    const isFreeRaw = (row["is_free"] ?? "").toLowerCase();
    const is_free = isFreeRaw === "true" || isFreeRaw === "1" || isFreeRaw === "yes";

    rows.push({
      title,
      title_ml: row["title_ml"] ?? row["title_malayalam"] ?? "",
      youtube_video_id,
      duration_seconds,
      is_free,
      order_index: parseInt(row["order_index"] ?? row["order"] ?? "") || rows.length,
    });
  });

  return { rows, errors };
}

function parseCorrectAnswer(val: string): number | null {
  const v = val.trim().toUpperCase();
  if (v === "A" || v === "0") return 0;
  if (v === "B" || v === "1") return 1;
  if (v === "C" || v === "2") return 2;
  if (v === "D" || v === "3") return 3;
  return null;
}

export async function parseQuestionsFile(file: File): Promise<{
  rows: ParsedQuestion[];
  errors: ParseError[];
}> {
  const raw = await readSheet(file);
  const rows: ParsedQuestion[] = [];
  const errors: ParseError[] = [];

  raw.forEach((rawRow, idx) => {
    const row = normaliseRow(rawRow);
    const rowNum = idx + 2;

    const text = row["question_text"] ?? row["text"] ?? row["question"] ?? "";
    const optA = row["option_a"] ?? row["a"] ?? "";
    const optB = row["option_b"] ?? row["b"] ?? "";
    const optC = row["option_c"] ?? row["c"] ?? "";
    const optD = row["option_d"] ?? row["d"] ?? "";
    const correctRaw = row["correct_answer"] ?? row["answer"] ?? row["correct"] ?? "";

    if (!text) {
      errors.push({ row: rowNum, message: "Missing required field: question_text" });
      return;
    }
    if (!optA || !optB || !optC || !optD) {
      errors.push({ row: rowNum, message: "All four options (option_a–d) are required" });
      return;
    }

    const correct_answer = parseCorrectAnswer(correctRaw);
    if (correct_answer === null) {
      errors.push({ row: rowNum, message: "correct_answer must be 0–3 or A–D" });
      return;
    }

    rows.push({
      text,
      text_ml: row["question_text_ml"] ?? row["text_ml"] ?? "",
      options: [optA, optB, optC, optD],
      correct_answer,
      explanation: row["explanation"] ?? "",
      marks: parseInt(row["marks"] ?? "") || 1,
    });
  });

  return { rows, errors };
}

export function downloadTemplate(type: "lessons" | "questions"): void {
  const headers =
    type === "lessons"
      ? ["title", "title_ml", "youtube_video_id", "duration_seconds", "is_free", "order_index"]
      : ["question_text", "question_text_ml", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "marks"];

  const example =
    type === "lessons"
      ? [["Introduction to Motion", "ചലനത്തിന്റെ ആമുഖം", "dQw4w9WgXcQ", "720", "false", "1"]]
      : [["What is Newton's first law?", "", "Objects at rest stay at rest", "F=ma", "Energy is conserved", "Action = reaction", "A", "Objects resist changes in motion", "1"]];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `${type}_template.xlsx`);
}
