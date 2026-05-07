"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Loader2, Check } from "lucide-react"

interface NCM {
  codigo: string
  descricao: string
}

export function NcmAutocomplete({ 
  defaultValue, 
  name = "ncm" 
}: { 
  defaultValue?: string | null
  name?: string 
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [displayValue, setDisplayValue] = useState(defaultValue || "")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<NCM[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch initial NCM description if defaultValue exists
  useEffect(() => {
    if (defaultValue) {
      fetch(`https://brasilapi.com.br/api/ncm/v1/${defaultValue.replace(/\D/g, '')}`)
        .then(res => res.json())
        .then((data: NCM) => {
          if (data && data.descricao) {
            setDisplayValue(`${data.codigo} - ${data.descricao}`)
          }
        })
        .catch(() => {
          // Ignore error, just keep default value
        })
    }
  }, [defaultValue])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounce search
  useEffect(() => {
    if (!open) return
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(query)}`)
        if (!res.ok) {
          if (res.status === 404) {
            setResults([])
          } else {
            throw new Error("Erro na busca")
          }
        } else {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        setError("Não foi possível buscar NCMs")
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, open])

  const handleSelect = (ncm: NCM) => {
    setDisplayValue(`${ncm.codigo} - ${ncm.descricao}`)
    setQuery("")
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDisplayValue("")
    setQuery("")
    setOpen(false)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Hidden input to store the actual NCM code for the form */}
      <input type="hidden" name={name} value={displayValue ? displayValue.split(" - ")[0] : ""} />
      
      <div 
        className="relative"
        onClick={() => {
          if (!open) {
            setQuery("")
            setOpen(true)
          }
        }}
      >
        <Input 
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder="Digite o código ou nome do NCM..."
          className="w-full pr-10"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          {!loading && displayValue && !open && (
            <button 
              type="button" 
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <span className="sr-only">Limpar</span>
              &times;
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scrollbar">
          {query.length < 2 ? (
            <div className="p-4 text-sm text-center text-slate-500">
              Digite pelo menos 2 caracteres para buscar...
            </div>
          ) : loading ? (
            <div className="p-4 text-sm text-center text-slate-500">
              Buscando NCMs...
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-center text-red-500">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-center text-slate-500">
              Nenhum NCM encontrado.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((ncm) => (
                <li 
                  key={ncm.codigo}
                  onClick={() => handleSelect(ncm)}
                  className="px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-primary">{ncm.codigo}</span>
                  <span className="text-slate-500 text-xs truncate" title={ncm.descricao}>{ncm.descricao}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
