'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

import { supabase } from '@/lib/supabase'
import { wrapInEmailLayout } from '@/lib/email/wrapper'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'
import { TEMPLATE_VARIABLES } from '@/lib/email/variables'
import { saveTemplate, toggleTemplateActive } from '@/app/actions/email-templates'
import { sendTestEmail } from '@/app/actions/email-templates'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  subject: string
  html_content: string
  is_active: boolean
  last_edited_by: string | null
  updated_at: string
}

// ─── Color presets ───────────────────────────────────────────────────────────

const COLOR_PRESETS = ['#0f2044', '#14b8a6', '#9e6b7a', '#ffffff', '#64748b']

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function TBBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-xs font-medium ${
        active ? 'bg-slate-200' : ''
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1" />
}

// ─── Color Picker Dropdown ───────────────────────────────────────────────────

function ColorPickerDropdown({
  label,
  onSelect,
  onClose,
}: {
  label: string
  onSelect: (color: string) => void
  onClose: () => void
}) {
  const [custom, setCustom] = useState('')
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 w-48">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      <div className="flex gap-2 mb-2 flex-wrap">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { onSelect(c); onClose() }}
            className="w-6 h-6 rounded border border-slate-200"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="#hex"
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={() => { if (custom) { onSelect(custom); onClose() } }}
          className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200"
        >
          OK
        </button>
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function EmailTemplateEditorPage() {
  const params = useParams()
  const templateKey = params.key as string
  const router = useRouter()

  // ─ State ─
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editorHtml, setEditorHtml] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showExampleData, setShowExampleData] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testError, setTestError] = useState('')
  const [showLinkPopup, setShowLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNewTab, setLinkNewTab] = useState(true)
  const [showCtaPopup, setShowCtaPopup] = useState(false)
  const [ctaText, setCtaText] = useState('Click Here')
  const [ctaUrl, setCtaUrl] = useState('')
  const [ctaColor, setCtaColor] = useState('#14b8a6')
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showVariableDropdown, setShowVariableDropdown] = useState(false)

  const lastFocused = useRef<'editor' | 'subject'>('editor')
  const isSavingRef = useRef(false)
  const subjectRef = useRef<HTMLInputElement>(null)

  // ─ Editor ─
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your email content here...' }),
    ],
    content: '',
    onUpdate: ({ editor: ed }) => {
      setIsDirty(true)
      setEditorHtml(ed.getHTML())
    },
    onFocus: () => {
      lastFocused.current = 'editor'
    },
  })

  // ─ Fetch template on mount ─
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single()

      if (error || !data) {
        router.replace('/admin/settings#email-templates')
        return
      }

      setTemplate(data as EmailTemplate)
      setSubject(data.subject)
      setIsActive(data.is_active)
      setEditorHtml(data.html_content ?? '')
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateKey])

  // ─ Fetch user email for test modal ─
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setTestEmailTo(data.user.email)
    })
  }, [])

  // ─ Set editor content once template + editor ready ─
  useEffect(() => {
    if (template && editor && !editor.isDestroyed) {
      editor.commands.setContent(template.html_content ?? '')
    }
  }, [template, editor])

  // ─ Unsaved changes guard ─
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ─ Auto-save every 30s ─
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setAutoSaveStatus('saving')
    try {
      await saveTemplate(templateKey, subject, editorHtml)
      setAutoSaveStatus('saved')
      setIsDirty(false)
      setTimeout(() => setAutoSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch {
      setAutoSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [templateKey, subject, editorHtml])

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty && !isSavingRef.current) {
        performSave()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isDirty, performSave])

  // ─ Insert variable ─
  function insertVariable(key: string) {
    const token = `{{${key}}}`
    if (lastFocused.current === 'subject') {
      setSubject((prev) => prev + token)
      setIsDirty(true)
    } else {
      editor?.chain().focus().insertContent(token).run()
    }
  }

  // ─ Handlers ─
  async function handleSave() {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setAutoSaveStatus('saving')
    try {
      await saveTemplate(templateKey, subject, editorHtml)
      setIsDirty(false)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch {
      setAutoSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }

  async function handleToggleActive() {
    const next = !isActive
    setIsActive(next)
    try {
      await toggleTemplateActive(templateKey, next)
    } catch {
      setIsActive(!next)
    }
  }

  function handleReset() {
    const defaults = DEFAULT_TEMPLATES[templateKey]
    if (!defaults) return
    editor?.commands.setContent(defaults.content)
    setEditorHtml(defaults.content)
    setSubject(defaults.subject)
    setIsDirty(true)
    setShowResetDialog(false)
  }

  async function handleSendTest() {
    setIsSendingTest(true)
    setTestError('')
    const result = await sendTestEmail(templateKey, testEmailTo, subject, editorHtml)
    setIsSendingTest(false)
    if (result.success) {
      setShowTestModal(false)
    } else {
      setTestError(result.error ?? 'Failed to send test email')
    }
  }

  function handleInsertLink() {
    if (!linkUrl) return
    editor
      ?.chain()
      .focus()
      .setLink({ href: linkUrl, target: linkNewTab ? '_blank' : undefined })
      .run()
    setShowLinkPopup(false)
    setLinkUrl('')
  }

  function handleInsertCta() {
    if (!ctaUrl || !ctaText) return
    const html = `<a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background-color:${ctaColor};color:white;text-decoration:none;border-radius:6px;font-weight:600;">${ctaText}</a>`
    editor?.chain().focus().insertContent(html).run()
    setShowCtaPopup(false)
    setCtaText('Click Here')
    setCtaUrl('')
    setCtaColor('#14b8a6')
  }

  function handleInsertDivider() {
    editor?.commands.insertContent(
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">',
    )
  }

  // ─ Preview ─
  const subjectWithExamples = useMemo(() => {
    let s = subject
    const vars = TEMPLATE_VARIABLES[templateKey] ?? []
    for (const v of vars) {
      s = s.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
    }
    return s
  }, [subject, templateKey])

  const previewHtml = useMemo(() => {
    let content = editorHtml
    if (showExampleData) {
      const vars = TEMPLATE_VARIABLES[templateKey] ?? []
      for (const v of vars) {
        content = content.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
      }
    }
    return wrapInEmailLayout(content)
  }, [editorHtml, showExampleData, templateKey])

  // ─ Loading skeleton ─
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 animate-pulse">
        <div className="h-14 bg-white border-b border-slate-200" />
        <div className="flex h-[calc(100vh-57px)]">
          <div className="w-[280px] bg-white border-r border-slate-200 p-5 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
          <div className="flex-1 bg-slate-100" />
          <div className="w-[320px] bg-white border-l border-slate-200" />
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top sticky bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/settings#email-templates')}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </button>

        <div className="flex-1 text-center text-slate-700 font-medium text-sm truncate">
          {template?.name ?? templateKey}
        </div>

        <div className="flex items-center gap-3">
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-slate-400">Saving...</span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-slate-400">Saved</span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="text-xs text-red-500">Save failed</span>
          )}

          <button
            onClick={() => setShowResetDialog(true)}
            className="text-sm text-red-500 hover:text-red-600 px-3 py-1.5"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className="text-sm border border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6]/10 rounded-lg px-4 py-1.5"
          >
            Send Test Email
          </button>
          <button
            onClick={handleSave}
            className="text-sm bg-[#14b8a6] text-white hover:bg-[#0d9488] rounded-lg px-4 py-1.5"
          >
            Save Template
          </button>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex h-[calc(100vh-57px)] overflow-hidden">
        {/* ── Left panel ── */}
        <div className="w-[280px] overflow-y-auto border-r border-slate-200 bg-white p-5 shrink-0">
          <h2 className="text-lg font-semibold text-[#1B3A5C] mb-1">
            {template?.name ?? templateKey}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {template?.description ?? ''}
          </p>

          {/* Active toggle */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <button
              onClick={handleToggleActive}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isActive ? 'Emails will send' : 'Emails paused'}
            </button>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Subject
            </label>
            <input
              ref={subjectRef}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setIsDirty(true)
              }}
              onFocus={() => {
                lastFocused.current = 'subject'
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/30"
            />
          </div>

          {/* Available Variables */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Available Variables
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES[templateKey]?.map((v) => (
                <div key={v.key} className="flex flex-col items-center">
                  <button
                    onClick={() => insertVariable(v.key)}
                    title={`Example: ${v.example}`}
                    className="text-xs px-2 py-1 rounded-full border border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6]/10 transition-colors"
                  >
                    {`{{${v.key}}}`}
                  </button>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {v.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Center panel ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          {/* Toolbar */}
          <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2 space-y-1 shrink-0">
            {/* Row 1 */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <TBBtn
                active={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Bold"
              >
                B
              </TBBtn>
              <TBBtn
                active={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Italic"
              >
                <span className="italic">I</span>
              </TBBtn>
              <TBBtn
                active={editor?.isActive('underline')}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="Underline"
              >
                <span className="underline">U</span>
              </TBBtn>
              <TBBtn
                active={editor?.isActive('strike')}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <span className="line-through">S</span>
              </TBBtn>

              <Divider />

              <TBBtn
                active={editor?.isActive('heading', { level: 1 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                H1
              </TBBtn>
              <TBBtn
                active={editor?.isActive('heading', { level: 2 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                H2
              </TBBtn>
              <TBBtn
                active={editor?.isActive('heading', { level: 3 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                H3
              </TBBtn>
              <TBBtn
                active={editor?.isActive('paragraph')}
                onClick={() => editor?.chain().focus().setParagraph().run()}
                title="Paragraph"
              >
                P
              </TBBtn>

              <Divider />

              {/* Text color */}
              <div className="relative">
                <TBBtn
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker)
                    setShowBgColorPicker(false)
                  }}
                  title="Text Color"
                >
                  <span className="flex flex-col items-center leading-none">
                    <span>A</span>
                    <span className="w-4 h-1 rounded-sm bg-current" />
                  </span>
                </TBBtn>
                {showTextColorPicker && (
                  <ColorPickerDropdown
                    label="Text Color"
                    onSelect={(c) => editor?.chain().focus().setColor(c).run()}
                    onClose={() => setShowTextColorPicker(false)}
                  />
                )}
              </div>

              {/* BG color (highlight via mark) */}
              <div className="relative">
                <TBBtn
                  onClick={() => {
                    setShowBgColorPicker(!showBgColorPicker)
                    setShowTextColorPicker(false)
                  }}
                  title="Background Color"
                >
                  <span className="flex flex-col items-center leading-none">
                    <span className="bg-yellow-200 px-0.5 rounded-sm">A</span>
                  </span>
                </TBBtn>
                {showBgColorPicker && (
                  <ColorPickerDropdown
                    label="Background Color"
                    onSelect={(c) =>
                      editor
                        ?.chain()
                        .focus()
                        .setMark('textStyle', { backgroundColor: c } as Record<string, string>)
                        .run()
                    }
                    onClose={() => setShowBgColorPicker(false)}
                  />
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <TBBtn
                active={editor?.isActive({ textAlign: 'left' })}
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M3 6h18M3 12h12M3 18h18" />
                </svg>
              </TBBtn>
              <TBBtn
                active={editor?.isActive({ textAlign: 'center' })}
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M3 6h18M6 12h12M3 18h18" />
                </svg>
              </TBBtn>
              <TBBtn
                active={editor?.isActive({ textAlign: 'right' })}
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M3 6h18M9 12h12M3 18h18" />
                </svg>
              </TBBtn>

              <Divider />

              <TBBtn
                active={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </TBBtn>
              <TBBtn
                active={editor?.isActive('orderedList')}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                title="Ordered List"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M10 6h11M10 12h11M10 18h11M4 6V4l-1 1M3 10h2l-2 2.5h2M3 16h1.5a.5.5 0 010 1H3v0h1.5a.5.5 0 010 1H3" />
                </svg>
              </TBBtn>

              <Divider />

              {/* Insert Link */}
              <div className="relative">
                <TBBtn
                  active={editor?.isActive('link')}
                  onClick={() => {
                    setShowLinkPopup(!showLinkPopup)
                    setShowCtaPopup(false)
                    setShowVariableDropdown(false)
                  }}
                  title="Insert Link"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </TBBtn>
                {showLinkPopup && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 w-64">
                    <p className="text-xs font-medium text-slate-500 mb-2">Insert Link</p>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 mb-2"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <input
                        type="checkbox"
                        checked={linkNewTab}
                        onChange={(e) => setLinkNewTab(e.target.checked)}
                        className="rounded"
                      />
                      Open in new tab
                    </label>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowLinkPopup(false)}
                        className="text-xs px-2 py-1 text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertLink}
                        className="text-xs px-3 py-1 bg-[#14b8a6] text-white rounded"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Insert CTA */}
              <div className="relative">
                <TBBtn
                  onClick={() => {
                    setShowCtaPopup(!showCtaPopup)
                    setShowLinkPopup(false)
                    setShowVariableDropdown(false)
                  }}
                  title="Insert CTA Button"
                >
                  <span className="text-[10px] leading-none bg-[#14b8a6] text-white px-1 py-0.5 rounded">
                    CTA
                  </span>
                </TBBtn>
                {showCtaPopup && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 w-64">
                    <p className="text-xs font-medium text-slate-500 mb-2">Insert CTA Button</p>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Button text"
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 mb-2"
                    />
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 mb-2"
                    />
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Button Color</p>
                      <div className="flex gap-2">
                        {COLOR_PRESETS.filter((c) => c !== '#ffffff').map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCtaColor(c)}
                            className={`w-5 h-5 rounded border ${ctaColor === c ? 'ring-2 ring-offset-1 ring-[#14b8a6]' : 'border-slate-200'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCtaPopup(false)}
                        className="text-xs px-2 py-1 text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertCta}
                        className="text-xs px-3 py-1 bg-[#14b8a6] text-white rounded"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Insert Divider */}
              <TBBtn onClick={handleInsertDivider} title="Insert Divider">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M3 12h18" />
                </svg>
              </TBBtn>

              {/* Insert Variable */}
              <div className="relative">
                <TBBtn
                  onClick={() => {
                    setShowVariableDropdown(!showVariableDropdown)
                    setShowLinkPopup(false)
                    setShowCtaPopup(false)
                  }}
                  title="Insert Variable"
                >
                  <span className="text-[10px] leading-none">{'{{}}'}</span>
                </TBBtn>
                {showVariableDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50 w-48">
                    {TEMPLATE_VARIABLES[templateKey]?.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => {
                          insertVariable(v.key)
                          setShowVariableDropdown(false)
                        }}
                        className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                      >
                        {`{{${v.key}}}`}{' '}
                        <span className="text-slate-400">{v.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor canvas */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="max-w-[600px] mx-auto bg-white border border-slate-200 shadow-sm rounded">
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-6 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-300 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
              />
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-[320px] overflow-y-auto border-l border-slate-200 bg-white p-5 shrink-0">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Preview</h3>
          <label className="flex items-center gap-2 mb-4 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showExampleData}
              onChange={(e) => setShowExampleData(e.target.checked)}
              className="rounded"
            />
            Show with example data
          </label>

          <div
            className="border border-slate-200 rounded overflow-hidden"
            style={{ height: '400px', overflowY: 'auto' }}
          >
            <div
              style={{
                transform: 'scale(0.533)',
                transformOrigin: 'top left',
                width: '187.5%',
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Reset to Default dialog ── */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-[#1B3A5C] text-lg mb-2">
              Reset to Default?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              This will replace the current content with the original default
              template. You can still undo by closing without saving.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Test Email modal ── */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-[#1B3A5C] text-lg mb-4">
              Send Test Email
            </h3>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Send to
              </label>
              <input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              All variables will be replaced with example values for the test.
            </p>
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Subject preview
              </p>
              <p className="text-sm text-slate-700 italic">
                {subjectWithExamples}
              </p>
            </div>
            {testError && (
              <p className="text-xs text-red-500 mb-4">{testError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="px-4 py-2 text-sm text-white bg-[#14b8a6] rounded-lg hover:bg-[#0d9488] disabled:opacity-50"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
