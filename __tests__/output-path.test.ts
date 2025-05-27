import { describe, expect, it } from 'bun:test'
import { determineOutputPath } from '../src/page-utils.ts'

describe('determineOutputPath', () => {
  it('should use provided output path when specified', () => {
    const result = determineOutputPath('/path/to/input.html', 'pdf', '/path/to/output.pdf')
    expect(result).toBe('/path/to/output.pdf')
  })

  it('should generate output path from local file when no output specified', () => {
    const result = determineOutputPath('/path/to/input.html', 'pdf')
    expect(result).toBe('/path/to/input.pdf')
  })

  it('should generate URL-safe output path from URL when no output specified', () => {
    const result = determineOutputPath('https://example.com/page?query=test', 'pdf')
    expect(result).toContain('.pdf')
    expect(result).not.toContain(':')
    expect(result).not.toContain('?')
  })

  it('should clip long filenames to 196 characters plus .pdf extension', () => {
    const longInput = `file://${'/very-long-path'.repeat(30)}.html`
    const result = determineOutputPath(longInput, 'pdf')
    expect(result.length).toBeLessThanOrEqual(200) // 196 + 4 (.pdf)
    expect(result.endsWith('.pdf')).toBe(true)
  })
})
