import type { Browser, Page } from 'puppeteer-core'
import { readFile, unlink } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { generatePdf } from '../src/command/pdf.ts'
import { logger } from '../src/logger.ts'
import { launchBrowser } from '../src/puppeteer.ts'

// Quiet logger for tests
logger.setQuiet(true)

async function verifyPdfGeneration(page: Page, input: string, outputPath: string) {
  try {
    // Generate PDF
    const resultPath = await generatePdf(page, input, outputPath)

    // Verify PDF was created
    const pdfContent = await readFile(outputPath)
    expect(pdfContent.length).toBeGreaterThan(0)
    expect(resultPath).toBe(outputPath)

    // Verify PDF starts with PDF magic number
    const pdfHeader = pdfContent.subarray(0, 4).toString()
    expect(pdfHeader).toBe('%PDF')
  }
  finally {
    await unlink(outputPath)
  }
}

describe('PDF Generation', () => {
  const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome'
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await launchBrowser({
      chromeExecutable: chromePath,
    })
    page = await browser.newPage()
  })

  afterAll(async () => {
    await browser.close()
  })

  test('should generate PDF from HTML file', async () => {
    const inputPath = `${import.meta.dir}/fixtures/hello.html`
    const outputPath = `${import.meta.dir}/fixtures/output.pdf`
    await verifyPdfGeneration(page, inputPath, outputPath)
  })

  test('should generate PDF from URL', async () => {
    const inputUrl = 'https://example.com'
    const outputPath = `${import.meta.dir}/fixtures/output-url.pdf`
    await verifyPdfGeneration(page, inputUrl, outputPath)
  }, 10000) // Increase timeout to 10 seconds
})
