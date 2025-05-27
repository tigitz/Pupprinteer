import type { Browser, Page, PaperFormat, PDFOptions } from 'puppeteer-core'
import type { GlobalOptions } from './global.ts'
import { createCommand } from '@commander-js/extra-typings'
import { logger } from '../logger'
import { determineOutputPath, preparePage, loadContent } from '../page-utils'
import { handleGlobalOpts } from './global.ts'

interface PdfCommandOptions {
  scale?: string
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
  landscape?: boolean
  pageRanges?: string
  format?: string
  width?: string
  height?: string
  preferCssPageSize?: boolean
  margin?: string
  omitBackground?: boolean
}

export function buildPdfCommand() {
  return createCommand('pdf')
    .description('Convert HTML to PDF. Most PDF options are taken from https://pptr.dev/api/puppeteer.pdfoptions')
    .option('--scale <number>', 'Scale of the webpage rendering')
    .option('--display-header-footer', 'Display header and footer')
    .option('--header-template <path>', 'Path to HTML template file for the print header')
    .option('--footer-template <path>', 'Path to HTML template file for the print footer')
    .option('--print-background', 'Print background graphics')
    .option('--landscape', 'Paper orientation')
    .option('--page-ranges <string>', 'Paper ranges to print, e.g., 1-5, 8, 11-13')
    .option('--format <string>', 'Paper format (letter, legal, tabloid, ledger, a0-a6)')
    .option('--width <string>', 'Paper width, accepts values labeled with units')
    .option('--height <string>', 'Paper height, accepts values labeled with units')
    .option('--prefer-css-page-size', 'Give any CSS @page size declared in the page priority')
    .option('--margin <string>', 'Paper margins, format: "top,right,bottom,left" in pixels or with units')
    .option('--omit-background', 'Hide default white background')
    .action(async (options, command) => {
      const globalOpts = command.optsWithGlobals()
      const browser = await handleGlobalOpts(globalOpts)
      await handlePdfCommand(globalOpts, options, browser)
    })
}

interface PdfCommandOptions {
  scale?: string
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
  landscape?: boolean
  pageRanges?: string
  format?: string
  width?: string
  height?: string
  preferCssPageSize?: boolean
  margin?: string
  omitBackground?: boolean
}

async function handlePdfCommand(globalOpts: GlobalOptions, cmdOptions: PdfCommandOptions, browser: Browser): Promise<void> {
  logger.debug('Starting PDF generation process')

  const pdfOptions = await parsePDFOptions(cmdOptions)

  const injectJs = globalOpts.injectJs ? await loadContent(globalOpts.injectJs) : undefined
  const injectCss = globalOpts.injectCss ? await loadContent(globalOpts.injectCss) : undefined

  const page = await browser.newPage()
  await page.setBypassCSP(true)

  try {
    await generatePdf(
      page,
      globalOpts.input,
      globalOpts.output,
      pdfOptions,
      globalOpts.waitAfterPageLoad ? Number.parseInt(globalOpts.waitAfterPageLoad) : 0,
      injectJs,
      injectCss,
    )
  }
  finally {
    await browser.close()
  }
}

export async function generatePdf(
  page: Page,
  input: string,
  output?: string,
  pdfSettings: PDFOptions = {},
  waitTime: number = 0,
  injectJs?: string,
  injectCss?: string,
): Promise<string> {
  await preparePage(page, input, waitTime || 0, injectJs, injectCss)

  const outputPath = determineOutputPath(input, 'pdf', output)

  logger.debug('Using PDF settings:', pdfSettings)
  logger.start('Generating PDF...')
  await page.pdf({
    path: outputPath,
    ...pdfSettings,
  })

  logger.success(`PDF generated successfully: ${outputPath}`)
  return outputPath
}

export function parseMarginOption(marginStr: string): PDFOptions['margin'] {
  const margins = marginStr.split(',')

  if (margins.length !== 4) {
    throw new Error('Margin must be specified as "top,right,bottom,left"')
  }

  return {
    top: margins[0],
    right: margins[1],
    bottom: margins[2],
    left: margins[3],
  }
}

export async function parsePDFOptions(options: PdfCommandOptions): Promise<PDFOptions> {
  const pdfOptions: PDFOptions = {}

  if (options.scale)
    pdfOptions.scale = Number(options.scale)
  if (options.displayHeaderFooter !== undefined)
    pdfOptions.displayHeaderFooter = options.displayHeaderFooter
  if (options.headerTemplate)
    pdfOptions.headerTemplate = await loadContent(options.headerTemplate)
  if (options.footerTemplate)
    pdfOptions.footerTemplate = await loadContent(options.footerTemplate)
  if (options.printBackground !== undefined)
    pdfOptions.printBackground = options.printBackground
  if (options.landscape !== undefined)
    pdfOptions.landscape = options.landscape
  if (options.pageRanges)
    pdfOptions.pageRanges = options.pageRanges
  if (options.format)
    pdfOptions.format = options.format as PaperFormat
  if (options.width)
    pdfOptions.width = options.width
  if (options.height)
    pdfOptions.height = options.height
  if (options.preferCssPageSize !== undefined)
    pdfOptions.preferCSSPageSize = options.preferCssPageSize
  if (options.margin)
    pdfOptions.margin = parseMarginOption(options.margin)
  if (options.omitBackground !== undefined)
    pdfOptions.omitBackground = options.omitBackground

  return pdfOptions
}
