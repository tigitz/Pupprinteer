import type { Page, PDFOptions } from 'puppeteer-core'
import { resolve } from 'node:path'
import filenamifyUrl from 'filenamify-url'
import { logger } from './logger'

export async function generatePdf(
  page: Page,
  input: string,
  output?: string,
  pdfSettings: PDFOptions = {},
  waitTime: number = 0,
  injectJs?: string,
  injectCss?: string,
): Promise<string> {
  const url = input.startsWith('http://') || input.startsWith('https://')
    ? input
    : `file://${resolve(input)}`

  logger.start(`Navigation to: ${url}`)
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  })
  logger.success('Page loaded successfully')

  if (injectCss) {
    logger.start('Injecting custom CSS...')
    await page.addStyleTag({ content: injectCss })
  }

  if (injectJs) {
    logger.start('Injecting JavaScript...')
    await page.addScriptTag({ content: injectJs })
  }

  if (waitTime > 0) {
    logger.start(`Waiting for ${waitTime}ms...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  let outputPath = output
  if (!outputPath) {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const urlFilename = filenamifyUrl(input)
      outputPath = `${urlFilename.slice(0, 196)}.pdf`
    }
    else {
      const inputPath = resolve(input)
      const basename = inputPath.replace(/\.[^/.]+$/, '')
      outputPath = `${basename.slice(0, 196)}.pdf`
    }
    logger.info(`No output path specified, using: ${outputPath}`)
  }

  logger.debug('Using PDF settings:', pdfSettings)
  logger.start('Generating PDF...')
  await page.pdf({
    path: outputPath,
    ...pdfSettings,
  })

  logger.success(`PDF generated successfully: ${outputPath}`)
  return outputPath
}
