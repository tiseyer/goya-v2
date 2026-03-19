import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_ADDRESS = `${process.env.EMAIL_FROM_NAME ?? 'GOYA'} <${process.env.EMAIL_FROM ?? 'hello@globalonlineyogaassociation.org'}>`
export const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'member@globalonlineyogaassociation.org'
