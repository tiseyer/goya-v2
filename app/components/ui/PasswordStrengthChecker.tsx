'use client'

import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/password-rules'

interface Props {
  password: string
}

export default function PasswordStrengthChecker({ password }: Props) {
  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <div
            key={rule.label}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              passed ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {passed ? (
              <Check size={14} className="shrink-0" />
            ) : (
              <Circle size={14} className="shrink-0" />
            )}
            <span>{rule.label}</span>
          </div>
        )
      })}
    </div>
  )
}
