import { useDropzone } from "react-dropzone";
import { Icon } from "./Icon";
import { Icons } from "../../lib/icons";
import { clsx } from "clsx";

interface FileUploadProps {
  onFile: (file: File) => void;
  accept?: Record<string, string[]>;
  label?: string;
  selectedFile?: File | null;
}

export function FileUpload({ onFile, accept = { "application/pdf": [".pdf"] }, label = "Drop PDF here or click to upload", selectedFile }: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { if (files[0]) onFile(files[0]); },
    accept,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
        isDragActive ? "border-teal bg-teal/5" : "border-ink/20 hover:border-teal/50 hover:bg-teal/5"
      )}
    >
      <input {...getInputProps()} />
      <Icon name={Icons.upload} size={32} className="mx-auto text-ink-3 mb-3 block" aria-hidden />
      {selectedFile ? (
        <p className="text-sm font-semibold text-teal">{selectedFile.name}</p>
      ) : (
        <p className="text-sm text-ink-3">{label}</p>
      )}
    </div>
  );
}
