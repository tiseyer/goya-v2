'use client'

import React from "react";
import { ArrowUp, Mic } from "lucide-react";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { className?: string; }
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea className={cn("flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none", className)} ref={ref} rows={1} {...props} />
));
Textarea.displayName = "Textarea";

interface PromptInputContextType { isLoading: boolean; value: string; setValue: (value: string) => void; maxHeight: number | string; onSubmit?: () => void; disabled?: boolean; }
const PromptInputContext = React.createContext<PromptInputContextType>({ isLoading: false, value: "", setValue: () => {}, maxHeight: 120, onSubmit: undefined, disabled: false });
function usePromptInput() { return React.useContext(PromptInputContext); }

interface PromptInputProps { isLoading?: boolean; value?: string; onValueChange?: (value: string) => void; maxHeight?: number | string; onSubmit?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; }
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(({ className, isLoading = false, maxHeight = 120, value, onValueChange, onSubmit, children, disabled = false }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value || "");
  const handleChange = (newValue: string) => { setInternalValue(newValue); onValueChange?.(newValue); };
  return (
    <PromptInputContext.Provider value={{ isLoading, value: value ?? internalValue, setValue: onValueChange ?? handleChange, maxHeight, onSubmit, disabled }}>
      <div ref={ref} className={cn("rounded-2xl border border-[var(--goya-border)] bg-[var(--background-secondary)] p-2 transition-all duration-300", className)}>{children}</div>
    </PromptInputContext.Provider>
  );
});
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps { disableAutosize?: boolean; placeholder?: string; }
const PromptInputTextarea: React.FC<PromptInputTextareaProps & React.ComponentProps<typeof Textarea>> = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = typeof maxHeight === "number" ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px` : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit?.(); } onKeyDown?.(e); };
  return <Textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} className={cn("text-sm", className)} disabled={disabled} placeholder={placeholder} {...props} />;
};

const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={cn("flex items-center gap-2", className)} {...props}>{children}</div>;

interface PromptInputBoxProps { onSend?: (message: string) => void; isLoading?: boolean; placeholder?: string; className?: string; disabled?: boolean; }
export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>((props, ref) => {
  const { onSend = () => {}, isLoading = false, placeholder = "Ask Mattea anything...", className, disabled = false } = props;
  const [input, setInput] = React.useState("");
  const hasContent = input.trim() !== "";
  const isDisabled = isLoading || disabled;

  const handleSubmit = () => {
    if (input.trim() && !isDisabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <PromptInput value={input} onValueChange={setInput} isLoading={isLoading} onSubmit={handleSubmit} className={cn("w-full", className)} disabled={isDisabled} ref={ref}>
      <PromptInputTextarea placeholder={placeholder} className="text-sm" />
      <PromptInputActions className="flex items-center justify-end gap-2 p-0 pt-1">
        <div className="relative group">
          <button
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
              hasContent && !isDisabled
                ? "bg-[var(--goya-primary)] text-white hover:opacity-80"
                : "bg-transparent text-[var(--foreground-tertiary)] hover:bg-[var(--background-tertiary)] hover:text-foreground cursor-default"
            )}
            onClick={hasContent && !isDisabled ? handleSubmit : undefined}
            disabled={isDisabled && !hasContent}
            aria-label={hasContent ? "Send message" : "Voice input (coming soon)"}
          >
            {hasContent ? <ArrowUp className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {!hasContent && (
            <span className="absolute bottom-full right-0 mb-1.5 px-2 py-1 text-xs bg-[var(--goya-surface)] border border-[var(--goya-border)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm text-foreground-secondary">
              Coming soon
            </span>
          )}
        </div>
      </PromptInputActions>
    </PromptInput>
  );
});
PromptInputBox.displayName = "PromptInputBox";
