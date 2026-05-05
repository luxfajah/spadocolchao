"use client"

import { useState, useRef } from "react"
import { Upload, X, FileText, File } from "lucide-react"

interface FileUploadProps {
  label?: string
  accept?: string
  hint?: string
  accentColor?: "rose" | "orange" | "primary"
  onChange: (file: File | null) => void
}

const colorMap = {
  rose: "hover:border-rose-400 hover:bg-rose-50 group-has-[:focus]:border-rose-400",
  orange: "hover:border-orange-400 hover:bg-orange-50",
  primary: "hover:border-primary hover:bg-primary/5",
}

const iconColorMap = {
  rose: "text-rose-500",
  orange: "text-orange-500",
  primary: "text-primary",
}

export function FileUploadField({
  label = "Documento Anexo",
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  hint = "PDF, DOC, DOCX ou imagem • Máx. 10MB",
  accentColor = "primary",
  onChange,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | null) {
    setSelectedFile(file)
    onChange(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function getFileIcon(file: File) {
    if (file.type === "application/pdf") return <FileText className={`h-5 w-5 ${iconColorMap[accentColor]}`} />
    return <File className={`h-5 w-5 ${iconColorMap[accentColor]}`} />
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">
        {label}
      </label>

      {selectedFile ? (
        /* Arquivo selecionado — preview */
        <div className={`flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 transition-all`}>
          <div className={`h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm`}>
            {getFileIcon(selectedFile)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${iconColorMap[accentColor]}`}>{selectedFile.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {formatSize(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="h-7 w-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      ) : (
        /* Zona de upload */
        <label
          className={`cursor-pointer flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all
            ${isDragOver ? `border-${accentColor === 'rose' ? 'rose' : accentColor === 'orange' ? 'orange' : 'primary'}-400 bg-${accentColor === 'rose' ? 'rose' : accentColor === 'orange' ? 'orange' : 'primary'}-50/50` : 'border-slate-200 bg-slate-50/50'}
            ${colorMap[accentColor]}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className={`h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-colors`}>
            <Upload className={`h-5 w-5 ${isDragOver ? iconColorMap[accentColor] : 'text-slate-400'} transition-colors`} />
          </div>
          <div className="text-center">
            <p className={`text-sm font-bold ${isDragOver ? iconColorMap[accentColor] : 'text-slate-500'} transition-colors`}>
              Clique ou arraste o arquivo aqui
            </p>
            <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-0.5">{hint}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  )
}
