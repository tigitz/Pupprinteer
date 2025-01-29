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

async function getLatestChromeInfo(platform?: ChromePlatform): Promise<{ version: string, downloadUrl: string, platform: ChromePlatform }> {
  const targetPlatform = platform || detectPlatform()
  logger.info('Fetching latest Chrome version info...')
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

  return {
    version: stableVersion.version,
    downloadUrl: download.url,
    platform: targetPlatform,
  }
}

async function chromeDownload(_verbose = false): Promise<void> {
  const chromeDir = path.join(process.cwd(), 'chrome')
  const versionFile = path.join(chromeDir, 'version.txt')

  const { version, downloadUrl } = await getLatestChromeInfo(undefined)

  if (!fs.existsSync(chromeDir)) {
    fs.mkdirSync(chromeDir, { recursive: true })
  }
  logger.info(`Latest Chrome version: ${version}`)
  logger.info(`Downloading Chrome from: ${downloadUrl}`)

  const zipPath = path.join(chromeDir, 'chrome.zip')
  const zipResponse = await fetch(downloadUrl)
  const zipBuffer = await zipResponse.arrayBuffer()
  fs.writeFileSync(zipPath, Buffer.from(zipBuffer))
  logger.info(`Chrome archive saved to: ${zipPath}`)

  fs.writeFileSync(versionFile, version)
}

if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  (async () => {
    try {
      const verbose = process.argv.includes('--verbose') || process.argv.includes('-v')
      logger.setVerbose(verbose)
      await chromeDownload(verbose)
      logger.success('Chrome downloaded successfully')
    }
    catch (error) {
      console.error('Failed to download Chrome:', error)
      process.exit(1)
    }
  })()
}

export { chromeDownload }
