'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp'

// ---- Root ----
const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, pattern = REGEXP_ONLY_DIGITS, ...props }, ref) => (
  <OTPInput
    ref={ref}
    pattern={pattern}
    className={['flex items-center gap-2', className].filter(Boolean).join(' ')}
    containerClassName="flex items-center gap-2"
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

// ---- Group ----
const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={['flex items-center', className].filter(Boolean).join(' ')}
    {...props}
  />
))
InputOTPGroup.displayName = 'InputOTPGroup'

// ---- Slot ----
interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<'div'> {
  index: number
}

const InputOTPSlot = React.forwardRef<React.ElementRef<'div'>, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] ?? {
      char: null,
      hasFakeCaret: false,
      isActive: false,
    }

    return (
      <div
        ref={ref}
        className={[
          'relative flex h-10 w-10 items-center justify-center border-y border-r border-white/15 text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
          isActive && 'z-10 ring-2 ring-[#2dd4bf]/40 border-[#2dd4bf]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-white duration-1000" />
          </div>
        )}
      </div>
    )
  },
)
InputOTPSlot.displayName = 'InputOTPSlot'

// ---- Separator ----
const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <span>-</span>
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
