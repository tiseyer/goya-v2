export function isQuestion(query: string): boolean {
  if (!query || query.trim().length < 15) return false

  const q = query.trim().toLowerCase()

  // Explicit question mark
  if (q.includes('?')) return true

  // English question starters
  const starters = [
    'how ', 'what ', 'when ', 'where ', 'why ', 'who ', 'which ',
    'can i', 'can you', 'could i', 'could you',
    'is there', 'are there', 'do i', 'do you', 'does ',
    'will ', 'would ', 'should ', 'how do', 'how can', 'how to',
    'what is', 'what are', 'what does',
    // German
    'wie ', 'was ', 'wann ', 'wo ', 'warum ', 'wer ', 'welche',
    'kann ich', 'kann man', 'gibt es', 'wie kann', 'wie bekomme',
    'wie funktioniert', 'was ist', 'was sind',
  ]

  if (starters.some(s => q.startsWith(s))) return true

  // Long queries (6+ words) are likely questions
  if (q.split(/\s+/).length >= 6) return true

  return false
}
