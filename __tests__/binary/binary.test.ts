// Use Node.js fs to list files in the directory
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createConsola } from 'consola'
import comparePng from 'png-visual-compare'

const logger = createConsola({
  level: 4, // Debug level
})

// Paths
const FIXTURES_DIR = join(process.cwd(), '__tests__/fixtures')
const BINARY_DIR = join(process.cwd(), '__tests__/binary/bin')
const OUTPUT_DIR = join(process.cwd(), '__tests__/binary/output')

// Test files
const HTML_PATH = join(FIXTURES_DIR, 'hello.html')
const HEADER_PATH = join(FIXTURES_DIR, 'test-header.html')
const FOOTER_PATH = join(FIXTURES_DIR, 'test-footer.html')
const CSS_PATH = join(FIXTURES_DIR, 'test-style.css')
const JS_PATH = join(FIXTURES_DIR, 'test-script.js')

// Output files
const PDF_OUTPUT = join(OUTPUT_DIR, 'test-output.pdf')
const SCREENSHOT_OUTPUT = join(OUTPUT_DIR, 'test-output.png')
const SCREENSHOT_DIFF = join(OUTPUT_DIR, 'screenshot-diff.png')

// Reference files
const REFERENCE_SCREENSHOT = join(process.cwd(), '__tests__/binary/output/reference-screenshot.png')

// Skip these tests during normal test runs
// They will only run when the file is explicitly specified
if (!process.argv.some(arg => arg.includes('binary.test.ts'))) {
  describe.skip('Binary Integration Tests', () => {
    it('skipped', () => {})
  })
}
else {
  describe('Binary Integration Tests', () => {
    let binaryPath: string | null = null

    // Setup: Find the binary
    beforeAll(async () => {
      // Find the binary
      if (!existsSync(BINARY_DIR)) {
        logger.warn('Binary directory not found. Please run download-binary.ts first.')
        return
      }

      const files = readdirSync(BINARY_DIR)
      const pupprinteerFiles = files.filter(file => file.startsWith('pupprinteer'))

      if (pupprinteerFiles.length === 0) {
        logger.warn('No pupprinteer binary found in the binary directory. Please run download-binary.ts first.')
        return
      }

      // Use the first pupprinteer binary found
      binaryPath = join(BINARY_DIR, pupprinteerFiles[0])
      logger.info(`Using binary: ${binaryPath}`)
    })

    // Clean up after tests
    afterAll(async () => {
      // Clean up test output files
      if (await Bun.file(PDF_OUTPUT).exists()) {
        await Bun.file(PDF_OUTPUT).delete()
      }

      if (await Bun.file(SCREENSHOT_OUTPUT).exists()) {
        await Bun.file(SCREENSHOT_OUTPUT).delete()
      }

      if (await Bun.file(SCREENSHOT_DIFF).exists()) {
        await Bun.file(SCREENSHOT_DIFF).delete()
      }
    })

    it('should generate a PDF with header, footer, and injected CSS/JS', async () => {
      // Skip if binary not found
      if (!binaryPath) {
        logger.warn('Skipping test: Binary not found')
        return
      }

      // Run the binary to generate PDF
      const pdfProcess = Bun.spawn([
        binaryPath,
        'pdf',
        '-i',
        HTML_PATH,
        '-o',
        PDF_OUTPUT,
        '--header-template',
        HEADER_PATH,
        '--footer-template',
        FOOTER_PATH,
        '--inject-css',
        CSS_PATH,
        '--inject-js',
        JS_PATH,
        '--display-header-footer',
        '--print-background',
        '-w',
        '500',
        '-v',
      ], {
        stdout: 'inherit',
        stderr: 'inherit',
      })

      const pdfExitCode = await pdfProcess.exited
      expect(pdfExitCode).toBe(0)

      // Verify PDF was created
      const pdfExists = await Bun.file(PDF_OUTPUT).exists()
      expect(pdfExists).toBe(true)

      // Verify PDF content
      const pdfContent = await Bun.file(PDF_OUTPUT).arrayBuffer()
      expect(pdfContent.byteLength).toBeGreaterThan(0)

      // Check PDF header (should start with %PDF)
      const pdfHeader = new Uint8Array(pdfContent.slice(0, 4))
      const headerText = new TextDecoder().decode(pdfHeader)
      expect(headerText).toBe('%PDF')
    }, 15000)

    it('should generate a screenshot with injected CSS/JS', async () => {
      // Skip if binary not found
      if (!binaryPath) {
        logger.warn('Skipping test: Binary not found')
        return
      }

      // Run the binary to generate screenshot
      const screenshotProcess = Bun.spawn([
        binaryPath,
        'screenshot',
        '-i',
        HTML_PATH,
        '-o',
        SCREENSHOT_OUTPUT,
        '--inject-css',
        CSS_PATH,
        '--inject-js',
        JS_PATH,
        '--full-page',
        '-w',
        '500',
        '-v',
      ], {
        stdout: 'inherit',
        stderr: 'inherit',
      })

      const screenshotExitCode = await screenshotProcess.exited
      expect(screenshotExitCode).toBe(0)

      // Verify screenshot was created
      const screenshotExists = await Bun.file(SCREENSHOT_OUTPUT).exists()
      expect(screenshotExists).toBe(true)

      // Verify screenshot content
      const screenshotContent = await Bun.file(SCREENSHOT_OUTPUT).arrayBuffer()
      expect(screenshotContent.byteLength).toBeGreaterThan(0)

      console.log(REFERENCE_SCREENSHOT)
      // Compare with reference screenshot if it exists
      const referenceExists = await Bun.file(REFERENCE_SCREENSHOT).exists()

      if (referenceExists) {
        const mismatchedPixels = comparePng(
          SCREENSHOT_OUTPUT,
          REFERENCE_SCREENSHOT,
          {
            diffFilePath: SCREENSHOT_DIFF,
            pixelmatchOptions: {
              threshold: 0.1, // Adjust threshold as needed
            },
          },
        )

        logger.info(`Screenshot comparison: ${mismatchedPixels} mismatched pixels`)
        expect(mismatchedPixels, `Visual difference detected. See diff at: ${SCREENSHOT_DIFF}`).toBeLessThan(500)
      }
      else {
        logger.warn(`Reference screenshot not found at: ${REFERENCE_SCREENSHOT}`)
        logger.info('Generated screenshot can be used as reference. Copy it with:')
        logger.info(`cp ${SCREENSHOT_OUTPUT} ${REFERENCE_SCREENSHOT}`)
      }
    }, 15000)
  })
}
