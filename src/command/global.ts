import type { Command } from '@commander-js/extra-typings'
import type { Browser } from 'puppeteer-core'
import chromeArchive from '../../chrome/chrome.zip' with { type: 'file' }
import chromeVersion from '../../chrome/version.txt' with { type: 'file' }
import { extractChromeToTemp } from '../asset-utils.ts'
import { logger } from '../logger.ts'
import { launchBrowser } from '../puppeteer.ts'

export interface GlobalOptions {
  chromeExecutable?: string
  verbose?: boolean
  quiet?: boolean
  headful?: boolean
  devtools?: boolean
  slowMo?: string
  debugPort?: string
  input: string
  output?: string
  waitAfterPageLoad?: string
  injectJs?: string
  injectCss?: string
}
let chromeBinary: string

export async function handleGlobalOpts(globalOptions: GlobalOptions): Promise<Browser> {
  if (globalOptions.quiet) {
    logger.setQuiet(true)
  }
  else {
    logger.setVerbose(globalOptions.verbose)
  }

  if (globalOptions.chromeExecutable) {
    logger.debug('Using provided Chrome executable:', globalOptions.chromeExecutable)
    chromeBinary = globalOptions.chromeExecutable
  }
  else {
    logger.debug('Starting Chrome binary initialization...')
    chromeBinary = await extractChromeToTemp({
      zipPath: chromeArchive,
      versionPath: chromeVersion,
    })
  }

  return await launchBrowser({
    ...globalOptions,
    chromeExecutable: globalOptions.chromeExecutable || chromeBinary,
  })
}

export function addDefaultOptions(program: Command): Command {
  return program
    .requiredOption('-i, --input <path>', 'Path to local HTML file or remote URL to capture')
    .option('-o, --output <path>', 'Destination path where the output file will be saved')
    .option(
      '-w, --wait-after-page-load <milliseconds>',
      'Additional time to wait in milliseconds after page load completes',
      '0',
    )
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
    .option('--inject-js <path>', 'Path to JavaScript file or URL to inject after page load')
    .option('--inject-css <path>', 'Path to CSS file or URL to inject after page load')
}
