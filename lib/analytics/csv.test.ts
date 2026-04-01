import { describe, it, expect } from 'vitest'
import { formatCsvValue, exportToCsv } from './csv'

describe('formatCsvValue', () => {
  it('returns empty string for null', () => {
    expect(formatCsvValue(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatCsvValue(undefined)).toBe('')
  })

  it('returns number as string without quotes', () => {
    expect(formatCsvValue(42)).toBe('42')
    expect(formatCsvValue(3.14)).toBe('3.14')
  })

  it('returns plain string without quotes when no special chars', () => {
    expect(formatCsvValue('hello')).toBe('hello')
  })

  it('wraps values containing commas in double quotes', () => {
    expect(formatCsvValue('Doe, John')).toBe('"Doe, John"')
  })

  it('escapes internal double quotes by doubling them', () => {
    expect(formatCsvValue('He said "hi"')).toBe('"He said ""hi"""')
  })

  it('wraps values containing newlines in double quotes', () => {
    expect(formatCsvValue('line1\nline2')).toBe('"line1\nline2"')
  })
})

describe('exportToCsv', () => {
  it('produces header + data line for a single-row input', () => {
    const result = exportToCsv([{ a: 1, b: 'hello' }], 'test.csv')
    expect(result).toBe('a,b\n1,hello')
  })

  it('returns empty string for empty array', () => {
    const result = exportToCsv([], 'test.csv')
    expect(result).toBe('')
  })

  it('handles multiple rows', () => {
    const result = exportToCsv([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ], 'test.csv')
    expect(result).toBe('name,age\nAlice,30\nBob,25')
  })

  it('wraps comma-containing values in double quotes', () => {
    const result = exportToCsv([{ name: 'Doe, John', score: 10 }], 'test.csv')
    expect(result).toBe('name,score\n"Doe, John",10')
  })

  it('escapes double quotes in values', () => {
    const result = exportToCsv([{ note: 'He said "hi"' }], 'test.csv')
    expect(result).toBe('note\n"He said ""hi"""')
  })

  it('renders null and undefined as empty cells', () => {
    const result = exportToCsv([{ a: null, b: undefined, c: 'ok' }], 'test.csv')
    expect(result).toBe('a,b,c\n,,ok')
  })
})
