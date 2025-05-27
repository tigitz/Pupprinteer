import type { Browser, Page } from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import comparePng from 'png-visual-compare'
import { generatePdf } from '../src/command/pdf.ts'
import { generateScreenshot } from '../src/command/screenshot.ts'
import { launchBrowser } from '../src/puppeteer.ts'

const TMP_DIR = join(tmpdir(), 'pupprinteer-test')
const FIXTURES_DIR = join(process.cwd(), '__tests__/fixtures')

/**
 * To generate a reference image, run:
 *
 * ```bash
 * bun run src/main.ts screenshot \
 *   -i __tests__/fixtures/hello.html \
 *   -o __tests__/fixtures/reference-injection.png \
 *   --inject-js __tests__/fixtures/test-script.js \
 *   --inject-css __tests__/fixtures/test-style.css
 * ```
 */
describe('CSS and JS injection', () => {
  const cssPath = join(FIXTURES_DIR, 'test-style.css')
  const jsPath = join(FIXTURES_DIR, 'test-script.js')
  const htmlPath = join(FIXTURES_DIR, 'hello.html')
  const outputPdfPath = join(TMP_DIR, 'injection-test.pdf')
  const outputImagePath = join(TMP_DIR, 'injection-test.png')
  const referenceImagePath = join(FIXTURES_DIR, 'reference-injection.png')

  const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome'
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    await mkdir(TMP_DIR, { recursive: true })

    browser = await launchBrowser({
      chromeExecutable: chromePath,
    })
    page = await browser.newPage()
  })

  afterAll(async () => {
    // Clean up test output
    if (await Bun.file(outputPdfPath).exists()) {
      await Bun.file(outputPdfPath).delete()
    }

    if (await Bun.file(outputImagePath).exists()) {
      await Bun.file(outputImagePath).delete()
    }

    const diffPath = join(TMP_DIR, 'screenshot-diff.png')
    if (await Bun.file(diffPath).exists()) {
      await Bun.file(diffPath).delete()
    }

    // Close browser
    await browser.close()
  })

  it('should inject custom CSS and JavaScript into the page', async () => {
    // Read the CSS and JS files
    const cssContent = await Bun.file(cssPath).text()
    const jsContent = await Bun.file(jsPath).text()

    // Generate PDF with CSS and JS injection
    const pdfPath = await generatePdf(
      page,
      htmlPath,
      outputPdfPath,
      {}, // default PDF settings
      0, // no wait time
      jsContent,
      cssContent,
    )

    // Verify PDF was created
    expect(await Bun.file(pdfPath).exists()).toBe(true)
    expect(pdfPath).toBe(outputPdfPath)
    const pdfContent = await Bun.file(outputPdfPath).arrayBuffer()
    expect(pdfContent.byteLength).toBeGreaterThan(0)

    // Generate screenshot directly instead of converting PDF
    const screenshotPath = await generateScreenshot(
      page,
      htmlPath,
      outputImagePath,
      {
        fullPage: true,
      },
      0, // no wait time
      jsContent,
      cssContent,
    )

    expect(await Bun.file(screenshotPath).exists()).toBe(true)
    const imageContent = await Bun.file(outputImagePath).arrayBuffer()
    expect(imageContent.byteLength).toBeGreaterThan(0)

    const diffPath = join(TMP_DIR, 'screenshot-diff.png')
    const mismatchedPixels = comparePng(
      outputImagePath,
      referenceImagePath,
      {
        diffFilePath: diffPath,
        pixelmatchOptions: {
          threshold: 0.1, // Adjust threshold as needed
        },
      },
    )

    expect(mismatchedPixels, `Visual difference detected. See diff at: ${diffPath}`).toBeLessThan(500)
  })
})
