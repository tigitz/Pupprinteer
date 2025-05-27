import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { parseMarginOption, parsePDFOptions } from '../src/command/pdf.ts'

describe('PDF Options Parsing', () => {
  const FIXTURES_DIR = join(process.cwd(), '__tests__/fixtures')
  const headerPath = join(FIXTURES_DIR, 'test-header.html')
  const footerPath = join(FIXTURES_DIR, 'test-footer.html')

  it('should parse margin options correctly', () => {
    const testCases = [
      {
        input: '10px,20px,30px,40px',
        expected: { top: '10px', right: '20px', bottom: '30px', left: '40px' },
      },
      {
        input: '1cm,2cm,3cm,4cm',
        expected: { top: '1cm', right: '2cm', bottom: '3cm', left: '4cm' },
      },
      {
        input: '0,0,0,0',
        expected: { top: '0', right: '0', bottom: '0', left: '0' },
      },
    ]

    for (const { input, expected } of testCases) {
      const result = parseMarginOption(input)
      expect(result).toEqual(expected)
    }
  })

  it('should throw an error for invalid margin format', () => {
    expect(() => parseMarginOption('10px,20px')).toThrow('Margin must be specified as "top,right,bottom,left"')
  })

  it('should parse PDF options correctly with all options', async () => {
    const options = {
      scale: '1.5',
      displayHeaderFooter: true,
      headerTemplate: headerPath,
      footerTemplate: footerPath,
      printBackground: true,
      landscape: true,
      pageRanges: '1-5',
      format: 'A4',
      width: '8.5in',
      height: '11in',
      margin: '10mm,20mm,30mm,40mm',
      preferCssPageSize: true,
      omitBackground: true,
    }

    const result = await parsePDFOptions(options)

    const headerContent = await Bun.file(headerPath).text()
    const footerContent = await Bun.file(footerPath).text()

    expect(result).toEqual({
      scale: 1.5,
      displayHeaderFooter: true,
      headerTemplate: headerContent,
      footerTemplate: footerContent,
      printBackground: true,
      landscape: true,
      pageRanges: '1-5',
      format: 'A4',
      width: '8.5in',
      height: '11in',
      margin: {
        top: '10mm',
        right: '20mm',
        bottom: '30mm',
        left: '40mm',
      },
      preferCSSPageSize: true,
      omitBackground: true,
    })
  })

  it('should handle empty options', async () => {
    const result = await parsePDFOptions({})
    expect(result).toEqual({})
  })
})
