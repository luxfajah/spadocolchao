"use client"

import * as React from "react"
import { Input } from "./input"
import { maskCPF, maskCNPJ, maskCEP, maskPhone, maskRG } from "@/lib/utils"

export interface MaskedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  maskType: "cpf" | "cnpj" | "cep" | "phone" | "rg" | "cpf-cnpj"
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ maskType, onChange, value, defaultValue, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(
      String(value || defaultValue || "")
    )

    const applyMask = (val: string, type: string) => {
      switch (type) {
        case "cpf":
          return maskCPF(val)
        case "cnpj":
          return maskCNPJ(val)
        case "cep":
          return maskCEP(val)
        case "phone":
          return maskPhone(val)
        case "rg":
          return maskRG(val)
        case "cpf-cnpj":
          return val.replace(/\D/g, "").length <= 11 ? maskCPF(val) : maskCNPJ(val)
        default:
          return val
      }
    }

    React.useEffect(() => {
      if (value !== undefined) {
        const newValue = applyMask(String(value), maskType)
        if (newValue !== displayValue) {
          setDisplayValue(newValue)
        }
      }
    }, [value, maskType, displayValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const originalValue = e.target.value
      const maskedValue = applyMask(originalValue, maskType)
      
      setDisplayValue(maskedValue)

      if (onChange) {
        // We propagate the masked value so validation logic can see the formatted string if needed
        // or just to maintain consistency with standard input behavior.
        // The sanitizeFormData function in the form will clean it before saving.
        const event = {
          ...e,
          target: {
            ...e.target,
            value: maskedValue,
          },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
      />
    )
  }
)
MaskedInput.displayName = "MaskedInput"

export { MaskedInput }
