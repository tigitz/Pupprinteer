import type { Browser } from 'puppeteer-core'
import type { GlobalOptions } from './global.ts'
import { createCommand } from '@commander-js/extra-typings'
import { getChromeExtractionPaths } from '../asset-utils'
import { logger } from '../logger'
import { handleGlobalOpts } from './global.ts'

interface DebugCommandOptions {
  format?: string
}

export function buildDebugCommand() {
  return createCommand('debug')
    .description('Display debug information about the current setup')
    .option('--format <format>', 'Output format (text or json)', 'text')
    .action(async (options, command) => {
      const globalOpts = command.optsWithGlobals()
      const browser = await handleGlobalOpts(globalOpts)
      await handleDebugCommand(globalOpts, options, browser)
    })
}

async function handleDebugCommand(globalOpts: GlobalOptions, cmdOptions: DebugCommandOptions, browser: Browser): Promise<void> {
  try {
    const debugInfo = await collectDebugInfo(globalOpts, browser)

    if (cmdOptions.format === 'json') {
      console.log(JSON.stringify(debugInfo, null, 2))
    }
    else {
      // Text format (default)
      logger.info('Debug Information:')
      logger.info('=================')

      logger.info('Chrome Paths:')
      logger.info(`- Executable: ${debugInfo.chrome.executablePath}`)
      logger.info(`- Temp Directory: ${debugInfo.chrome.tempDir}`)
      logger.info(`- Version File: ${debugInfo.chrome.versionFile}`)
      logger.info(`- Platform: ${debugInfo.chrome.platform}`)

      logger.info('\nBrowser Information:')
      logger.info(`- Version: ${debugInfo.browser.version}`)
      logger.info(`- User Agent: ${debugInfo.browser.userAgent}`)

      logger.info('\nGlobal Options:')
      for (const [key, value] of Object.entries(debugInfo.options)) {
        logger.info(`- ${key}: ${value}`)
      }
    }
  }
  finally {
    await browser.close()
  }
}

async function collectDebugInfo(globalOpts: GlobalOptions, browser: Browser) {
  const chromePaths = getChromeExtractionPaths()

  const version = await browser.version()
  const userAgent = await browser.userAgent()

  return {
    chrome: {
      executablePath: globalOpts.chromeExecutable || chromePaths.execPath,
      tempDir: chromePaths.tempDir,
      versionFile: chromePaths.versionFile,
      platform: chromePaths.platform,
    },
    browser: {
      version,
      userAgent,
    },
    options: {
      ...globalOpts,
      // Don't include the input in the output if it's a URL (could be sensitive)
      input: globalOpts.input.startsWith('http') ? '[URL redacted]' : globalOpts.input,
    },
  }
}
