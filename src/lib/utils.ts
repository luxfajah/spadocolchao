import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: Date | string, formatStr?: string): string {
  if (!date) return "-"
  const d = new Date(date)

  if (formatStr === "dd/MM/yyyy HH:mm") {
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return d.toLocaleDateString("pt-BR")
}

export function cleanNumericValues(value?: string | null): string {
  if (!value) return ""
  return String(value).replace(/\D/g, "")
}

// Mantém compatibilidade com código existente e adiciona alias semântico
export const cleanNonDigits = cleanNumericValues
export const unmask = cleanNumericValues

export function maskCPF(value: string): string {
  const v = cleanNumericValues(value).slice(0, 11)
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})/, "$1-$2")
}

export function maskCNPJ(value: string): string {
  const v = cleanNumericValues(value).slice(0, 14)
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d{1,2})/, "$1-$2")
}

export function maskCEP(value: string): string {
  const v = cleanNumericValues(value).slice(0, 8)
  return v.replace(/(\d{5})(\d)/, "$1-$2")
}

export function maskPhone(value: string): string {
  const v = cleanNumericValues(value).slice(0, 11)

  if (v.length <= 10) {
    return v
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  return v
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

export function maskRG(value: string): string {
  // Máscara flexível para RG (aceita dígitos e letra final X)
  const clean = (value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9)

  if (clean.length <= 2) return clean
  if (clean.length <= 5) return clean.replace(/(\w{2})(\w+)/, "$1.$2")
  if (clean.length <= 8) return clean.replace(/(\w{2})(\w{3})(\w+)/, "$1.$2.$3")
  return clean.replace(/(\w{2})(\w{3})(\w{3})(\w+)/, "$1.$2.$3-$4")
}

export function formatDocument(value: string | null): string {
  if (!value) return "-"
  const v = cleanNumericValues(value)
  if (v.length === 11) return maskCPF(v)
  if (v.length === 14) return maskCNPJ(v)
  return value
}
