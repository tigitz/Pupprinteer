import type { ChromePlatform } from '../src/chrome-utils'
import type { ChromeVersionsResponse } from './types.ts'
import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
// When run directly, download Chrome
import { pathToFileURL } from 'node:url'
import { detectPlatform } from '../src/chrome-utils'

import { logger } from '../src/logger'

export interface ChromeInfo {
  version: string
  downloadUrl: string
  platform: ChromePlatform
}

export interface ChromeDownloadOptions {
  skipDownload?: boolean
  outputDir?: string
  platform?: ChromePlatform
}

export async function getLatestChromeInfo(platform?: ChromePlatform): Promise<ChromeInfo> {
  const targetPlatform = platform || detectPlatform()
  logger.info('Fetching latest Chrome version info...')
  logger.debug(`Target platform: ${targetPlatform}`)
  const response = await fetch('https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json')
  const data = await response.json() as ChromeVersionsResponse

  const stableVersion = data.channels.Stable
  if (!stableVersion) {
    throw new Error('No Stable Chrome version found')
  }

  const download = stableVersion.downloads['chrome-headless-shell'].find(d => d.platform === targetPlatform)

  if (!download) {
    throw new Error(`No download found for platform: ${targetPlatform}`)
  }

  logger.debug(`Found download URL for platform ${targetPlatform}: ${download.url}`)
  return {
    version: stableVersion.version,
    downloadUrl: download.url,
    platform: targetPlatform,
  }
}

export function getChromeDownloadPaths(outputDir?: string): { chromeDir: string, versionFile: string, zipPath: string } {
  const chromeDir = outputDir || path.join(process.cwd(), 'chrome')
  const versionFile = path.join(chromeDir, 'version.txt')
  const zipPath = path.join(chromeDir, 'chrome.zip')

  return { chromeDir, versionFile, zipPath }
}

export async function chromeDownload(options: ChromeDownloadOptions = {}): Promise<ChromeInfo> {
  const { chromeDir, versionFile, zipPath } = getChromeDownloadPaths(options.outputDir)
  const chromeInfo = await getLatestChromeInfo(options.platform)

  if (!fs.existsSync(chromeDir)) {
    fs.mkdirSync(chromeDir, { recursive: true })
  }
  logger.info(`Latest Chrome version: ${chromeInfo.version}`)
  logger.info(`Chrome download URL: ${chromeInfo.downloadUrl}`)

  if (!options.skipDownload) {
    logger.info(`Downloading Chrome from: ${chromeInfo.downloadUrl}`)
    const zipResponse = await fetch(chromeInfo.downloadUrl)
    const zipBuffer = await zipResponse.arrayBuffer()
    fs.writeFileSync(zipPath, Buffer.from(zipBuffer))
    logger.info(`Chrome archive saved to: ${zipPath}`)
  }
  else {
    logger.info('Skipping actual download (skipDownload option enabled)')
  }

  fs.writeFileSync(versionFile, chromeInfo.version)
  return chromeInfo
}

if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  (async () => {
    try {
      const verbose = process.argv.includes('--verbose') || process.argv.includes('-v')
      const skipDownload = process.argv.includes('--skip-download')
      
      // Parse platform argument
      const platformArgIndex = process.argv.findIndex(arg => arg.startsWith('--platform='))
      let platform: ChromePlatform | undefined
      
      if (platformArgIndex !== -1) {
        const platformValue = process.argv[platformArgIndex].split('=')[1] as ChromePlatform
        if (platformValue) {
          platform = platformValue
          logger.info(`Using specified platform: ${platform}`)
        }
      }
      
      logger.setVerbose(verbose)
      await chromeDownload({ skipDownload, platform })
      logger.success('Chrome download process completed successfully')
    }
    catch (error) {
      console.error('Failed to download Chrome:', error)
      process.exit(1)
    }
  })()
}
