import type { Browser, PDFOptions } from 'puppeteer-core'
import { Command } from '@commander-js/extra-typings'
import chromeArchive from '../chrome/chrome.zip' with { type: 'file' }
import chromeVersion from '../chrome/version.txt' with { type: 'file' }
import { extractChromeToTemp } from './asset-utils'
import { logger } from './logger'

import { generatePdf } from './pdf-generator'
import { parsePDFOptions } from './pdf-options'
import { launchBrowser } from './puppeteer'

let chromeBinary: string

const program = new Command()
  .name('Pupprinteer')
  .description('Browser automation and conversion tools using Puppeteer')
  .version('0.0.1')
  .option('-v, --verbose', 'Enable detailed debug logging output', false)
  .option('-q, --quiet', 'Disable all logging output', false)
  .option('--headful', 'Launch Chrome in headful mode (non-headless)', false)
  .option('--devtools', 'Auto-open DevTools panel', false)
  .option('--slowMo <milliseconds>', 'Slow down Puppeteer operations by specified milliseconds', '0')
  .option('--debug-port <port>', 'Chrome debugging port', '9222')
  .option(
    '-e, --chrome-executable <path>',
    'Custom Chrome browser executable path (uses bundled Chrome if not specified)',
  )

program.command('pdf')
  .description('Convert HTML to PDF. Most PDF options are taken from https://pptr.dev/api/puppeteer.pdfoptions')
  .requiredOption('-i, --input <path>', 'Path to local HTML file or remote URL to convert')
  .option('-o, --output <path>', 'Destination path where the PDF file will be saved')
  .option(
    '-w, --wait-after-page-load <milliseconds>',
    'Additional time to wait in milliseconds after page load completes',
    '0',
  )

  // PDF-specific options
  .option(
    '-p, --pdf-settings <path>',
    'Path to JSON file containing base PDF settings (will be overridden by specific options)',
  )
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
  .option('--inject-js <path>', 'Path to JavaScript file to inject after page load')
  .option('--inject-css <path>', 'Path to CSS file to inject after page load')
  .action(async (options, command) => {
    const globalOpts = command.optsWithGlobals()

    if (globalOpts.quiet) {
      logger.setQuiet(true)
    }
    else {
      logger.setVerbose(globalOpts.verbose)
    }
    const browser = await handleGlobalOpts(globalOpts)
    console.warn(options)
    await handlePdfCommand(options, browser)
  })

interface GlobalOptions {
  chromeExecutable?: string
  verbose?: boolean
  headful?: boolean
  devtools?: boolean
  slowMo?: string
  debugPort?: string
}

async function handleGlobalOpts(globalOptions: GlobalOptions): Promise<Browser> {
  if (globalOptions.chromeExecutable) {
    logger.debug('Using provided Chrome executable:', globalOptions.chromeExecutable)
    chromeBinary = globalOptions.chromeExecutable
  }
  else {
    logger.debug('Starting Chrome binary initialization...')
    chromeBinary = await extractChromeToTemp(chromeArchive, chromeVersion)
  }

  return await launchBrowser({
    ...globalOptions,
    chromeExecutable: globalOptions.chromeExecutable || chromeBinary,
  })
}

interface PdfCommandOptions {
  pdfSettings?: string
  input: string
  output?: string
  waitAfterPageLoad?: string
  injectJs?: string
  injectCss?: string
}

async function handlePdfCommand(cmdOptions: PdfCommandOptions, browser: Browser): Promise<void> {
  logger.debug('Starting PDF generation process')

  const basePdfSettings: PDFOptions = cmdOptions.pdfSettings
    ? JSON.parse(await Bun.file(cmdOptions.pdfSettings).text())
    : {}

  const specificPdfOptions = await parsePDFOptions(cmdOptions)
  const finalPdfSettings = {
    ...basePdfSettings,
    ...specificPdfOptions,
  }

  const injectJs = cmdOptions.injectJs ? await Bun.file(cmdOptions.injectJs).text() : undefined
  const injectCss = cmdOptions.injectCss ? await Bun.file(cmdOptions.injectCss).text() : undefined

  const page = await browser.newPage()
  await page.setBypassCSP(true)

  try {
    await generatePdf(
      page,
      cmdOptions.input,
      cmdOptions.output,
      finalPdfSettings,
      cmdOptions.waitAfterPageLoad ? Number.parseInt(cmdOptions.waitAfterPageLoad) : 0,
      injectJs,
      injectCss,
    )
  }
  finally {
    await browser.close()
  }
}

async function main(): Promise<void> {
  await program.parseAsync()
}

main()
