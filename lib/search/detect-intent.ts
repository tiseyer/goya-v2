export function isQuestion(query: string): boolean {
  if (!query || query.trim().length < 4) return false

  const q = query.trim().toLowerCase()

  // Question marks
  if (q.includes('?')) return true

  // Question words (English + German)
  const questionStarters = [
    'how', 'what', 'when', 'where', 'why', 'who', 'which', 'can', 'could',
    'is ', 'are ', 'do ', 'does ', 'did ', 'will ', 'would ', 'should ',
    'wie', 'was', 'wann', 'wo', 'warum', 'wer', 'welche', 'welcher', 'welches',
    'kann', 'können', 'ist ', 'sind ', 'gibt es', 'wie kann', 'wie bekomme',
    'wie funktioniert', 'what is', 'how do', 'how can', 'how to',
  ]

  if (questionStarters.some(w => q.startsWith(w))) return true

  // Long queries (5+ words) that aren't just names/keywords
  const wordCount = q.split(/\s+/).length
  if (wordCount >= 5) return true

  return false
}
