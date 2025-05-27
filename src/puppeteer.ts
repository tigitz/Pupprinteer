import type { Browser, LaunchOptions as PupeeteerLaunchOptions } from 'puppeteer-core'
import puppeteer from 'puppeteer-core'
import { logger } from './logger'

export interface LaunchOptions {
  chromeExecutable: string
  headful?: boolean
  devtools?: boolean
  slowMo?: string
  debugPort?: string
}

export async function launchBrowser(options: LaunchOptions): Promise<Browser> {
  logger.start('Launching browser...')

  const launchOptions = prepareLaunchOptions(options)
  const browser = await puppeteer.launch(launchOptions)

  logger.success('Browser launched successfully')
  return browser
}

export function prepareLaunchOptions(options: LaunchOptions): PupeeteerLaunchOptions {
  const slowMo = options.slowMo ? Number.parseInt(options.slowMo) : undefined
  const debugPort = options.debugPort ? Number.parseInt(options.debugPort) : undefined

  return {
    executablePath: options.chromeExecutable,
    headless: !options.headful,
    devtools: options.devtools,
    slowMo,
    debuggingPort: debugPort,
  }
}
