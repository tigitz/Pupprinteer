import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createConsola } from 'consola'
import { detectPlatform } from '../../src/chrome-utils'

const logger = createConsola({
  level: 4, // Set to debug level by default
})

interface GitHubRelease {
  tag_name: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

async function getLatestReleaseVersion(): Promise<string> {
  try {
    const url = 'https://api.github.com/repos/tigitz/pupprinteer/releases/latest'
    logger.debug(`Fetching latest release from: ${url}`)

    const response = await fetch(url)
    logger.debug(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.statusText}`)
    }

    const data = await response.json() as GitHubRelease
    logger.debug(`Latest release tag: ${data.tag_name}`)
    return data.tag_name
  }
  catch (error) {
    logger.error('Error fetching latest release version:', error)
    throw error
  }
}

async function downloadBinary(version?: string): Promise<string> {
  // If no version provided, get the latest
  logger.debug(`Input version parameter: ${version || 'not provided'}`)

  const releaseVersion = version || await getLatestReleaseVersion()
  logger.info(`Using release version: ${releaseVersion}`)

  // Determine platform suffix
  const platform = detectPlatform()
  logger.debug(`Detected platform: ${platform}`)
  logger.debug(`Process architecture: ${process.arch}`)

  let platformSuffix: string

  switch (platform) {
    case 'linux64':
      platformSuffix = process.arch === 'arm64' ? 'linux-arm64' : 'linux-x64'
      break
    case 'mac-arm64':
      platformSuffix = 'mac-arm64'
      break
    case 'mac-x64':
      platformSuffix = 'mac-x64'
      break
    case 'win64':
    case 'win32':
      platformSuffix = 'win64'
      break
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }

  logger.debug(`Using platform suffix: ${platformSuffix}`)

  // Construct binary name and URL
  const isWindows = platform === 'win64' || platform === 'win32'
  const binaryName = `pupprinteer-${releaseVersion}-${platformSuffix}${isWindows ? '.exe' : ''}`
  const downloadUrl = `https://github.com/tigitz/Pupprinteer/releases/download/${releaseVersion}/${binaryName}`

  logger.info(`Downloading binary from: ${downloadUrl}`)
  logger.debug(`Binary name: ${binaryName}`)

  try {
    // Create binary directory if it doesn't exist
    const binaryDir = join(process.cwd(), '__tests__/binary/bin')
    if (!existsSync(binaryDir)) {
      mkdirSync(binaryDir, { recursive: true })
    }

    // Download the binary
    logger.debug(`Starting download from: ${downloadUrl}`)
    const response = await fetch(downloadUrl)
    logger.debug(`Download response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      throw new Error(`Failed to download binary: ${response.statusText}`)
    }

    const binaryPath = join(binaryDir, binaryName)
    const buffer = await response.arrayBuffer()
    writeFileSync(binaryPath, Buffer.from(buffer))

    // Make binary executable on non-Windows platforms
    if (!isWindows) {
      Bun.spawn(['chmod', '+x', binaryPath])
    }

    logger.success(`Binary downloaded successfully to: ${binaryPath}`)
    return binaryPath
  }
  catch (error) {
    logger.error('Error downloading binary:', error)
    throw error
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const versionArg = args.length > 0 ? args[0] : undefined

// Run the download function
downloadBinary(versionArg).catch((error) => {
  logger.error('Failed to download binary:', error)
  process.exit(1)
})
