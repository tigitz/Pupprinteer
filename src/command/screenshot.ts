import type { Browser, Page, ScreenshotOptions } from 'puppeteer-core'
import type { FileExtension } from '../types'
import type { GlobalOptions } from './global.ts'
import { createCommand } from '@commander-js/extra-typings'
import { logger } from '../logger'
import { determineOutputPath, loadContent, preparePage } from '../page-utils'
import { handleGlobalOpts } from './global.ts'

export function buildScreenshotCommand() {
  return createCommand('screenshot')
    .description('Capture a screenshot of a webpage or HTML file')
    .option('--full-page', 'Capture the full scrollable page, not just the viewport', true)
    .option('--quality <number>', 'JPEG quality (0-100), only applies when type is jpeg or webp', '80')
    .option('--type <type>', 'Screenshot type, either jpeg, png or webp', 'png')
    .option('--omit-background', 'Make background transparent if possible', false)
    .option('--clip <string>', 'Clip area of the page, format: "x,y,width,height"')
    .option('--optimize-for-speed', 'Optimize for speed instead of quality', false)
    .option('--from-surface <boolean>', 'Capture from surface rather than view', 'true')
    .option('--capture-beyond-viewport <boolean>', 'Capture beyond the viewport', 'false')
    .option('--encoding <type>', 'Encoding of the image (base64 or binary)', 'binary')
    .action(async (options, command) => {
      const globalOpts = command.optsWithGlobals()
      const browser = await handleGlobalOpts(globalOpts)
      await handleScreenshotCommand(globalOpts, options, browser)
    })
}

interface ScreenshotCommandOptions {
  fullPage?: boolean
  quality?: string
  type?: string
  omitBackground?: boolean
  clip?: string
  optimizeForSpeed?: boolean
  fromSurface?: string
  captureBeyondViewport?: string
  encoding?: 'base64' | 'binary'
}

async function handleScreenshotCommand(globalOpts: GlobalOptions, cmdOptions: ScreenshotCommandOptions, browser: Browser): Promise<void> {
  logger.debug('Starting screenshot generation process')

  const screenshotSettings: ScreenshotOptions = {
    fullPage: cmdOptions.fullPage !== false,
  }

  if (cmdOptions.type) {
    screenshotSettings.type = cmdOptions.type as 'jpeg' | 'png' | 'webp'
  }

  // Only set quality for jpeg or webp
  if (cmdOptions.quality
    && (screenshotSettings.type === 'jpeg' || screenshotSettings.type === 'webp')) {
    screenshotSettings.quality = Number(cmdOptions.quality)
  }

  if (cmdOptions.omitBackground) {
    screenshotSettings.omitBackground = true
  }

  if (cmdOptions.clip) {
    const [x, y, width, height] = cmdOptions.clip.split(',').map(Number)
    if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(width) && !Number.isNaN(height)) {
      screenshotSettings.clip = { x, y, width, height }
    }
    else {
      logger.error('Invalid clip format. Expected "x,y,width,height"')
    }
  }

  if (cmdOptions.optimizeForSpeed) {
    screenshotSettings.optimizeForSpeed = true
  }

  if (cmdOptions.fromSurface !== undefined) {
    screenshotSettings.fromSurface = cmdOptions.fromSurface === 'true'
  }

  if (cmdOptions.captureBeyondViewport !== undefined) {
    screenshotSettings.captureBeyondViewport = cmdOptions.captureBeyondViewport === 'true'
  }

  if (cmdOptions.encoding) {
    screenshotSettings.encoding = cmdOptions.encoding
  }

  const injectJs = globalOpts.injectJs ? await loadContent(globalOpts.injectJs) : undefined
  const injectCss = globalOpts.injectCss ? await loadContent(globalOpts.injectCss) : undefined

  const page = await browser.newPage()
  await page.setBypassCSP(true)

  try {
    await generateScreenshot(
      page,
      globalOpts.input,
      globalOpts.output,
      screenshotSettings,
      globalOpts.waitAfterPageLoad ? Number.parseInt(globalOpts.waitAfterPageLoad) : 0,
      injectJs,
      injectCss,
    )
  }
  finally {
    await browser.close()
  }
}

export async function generateScreenshot(
  page: Page,
  input: string,
  output?: string,
  screenshotSettings: ScreenshotOptions = {},
  waitTime: number = 0,
  injectJs?: string,
  injectCss?: string,
): Promise<string> {
  await preparePage(page, input, waitTime || 0, injectJs, injectCss)

  const fileExtension = (screenshotSettings.type || 'png') as FileExtension
  const outputPath = determineOutputPath(input, fileExtension, output)

  logger.debug('Using screenshot settings:', screenshotSettings)
  logger.start('Generating screenshot...')
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    ...screenshotSettings,
  })

  logger.success(`Screenshot generated successfully: ${outputPath}`)
  return outputPath
}
