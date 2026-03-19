import { Resend } from 'resend'

export const FROM_ADDRESS = 'hello@globalonlineyogaassociation.org'
export const REPLY_TO = 'member@globalonlineyogaassociation.org'

// Lazy initialization — don't crash at build time if key is missing
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// Proxy for backwards compatibility — initializes lazily at call time
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as never)[prop as never]
  },
})
