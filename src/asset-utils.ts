import { mkdir, unlink } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import extract from 'extract-zip'
import { detectPlatform, getChromeExecutablePath } from './chrome-utils'
import { logger } from './logger'

export interface ChromeExtractionPaths {
  tempDir: string
  versionFile: string
  execPath: string
  tempZipPath: string
  platform: string
  version?: string
}

export interface BundlePaths {
  zipPath: string
  versionPath: string
}

export function getChromeExtractionPaths(customTempDir?: string): ChromeExtractionPaths {
  const tempDir = customTempDir || join(os.tmpdir(), 'pupprinteer-chrome')
  const versionFile = join(tempDir, 'version.txt')
  const platform = detectPlatform()
  const execPath = getChromeExecutablePath(tempDir, platform)
  const tempZipPath = join(tempDir, 'chrome-temp.zip')

  return {
    tempDir,
    versionFile,
    execPath,
    tempZipPath,
    platform,
  }
}

/**
 * Checks if a previously extracted Chrome binary can be reused
 */
export async function canReuseExistingChrome(
  paths: ChromeExtractionPaths,
  bundledVersion: string,
): Promise<boolean> {
  const versionFileExists = await Bun.file(paths.versionFile).exists()
  if (!versionFileExists) {
    logger.debug('No existing version file found')
    return false
  }

  try {
    const previousVersion = await Bun.file(paths.versionFile).text()
    logger.info('Found existing Chrome version:', previousVersion.trim())

    if (previousVersion.trim() !== bundledVersion.trim()) {
      return false
    }

    const execExists = await Bun.file(paths.execPath).exists()
    if (!execExists) {
      return false
    }

    logger.success('Using existing Chrome binary - skipping extraction')
    return true
  }
  catch (error) {
    logger.error('Error reading version file:', error)
    return false
  }
}

export async function extractChromeZip(
  zipPath: string,
  paths: ChromeExtractionPaths,
  bundledVersion: string,
): Promise<boolean> {
  try {
    // Check if ZIP file exists
    const zipExists = await Bun.file(zipPath).exists()
    if (!zipExists) {
      logger.warn(`Chrome ZIP file not found at: ${zipPath}`)

      // Check if there's an existing Chrome installation we can use
      const execExists = await Bun.file(paths.execPath).exists()
      if (execExists) {
        logger.info('Using existing Chrome installation')
        return true
      }

      throw new Error('Chrome ZIP not found')
    }

    const zipContent = await Bun.file(zipPath).arrayBuffer()
    await Bun.write(paths.tempZipPath, zipContent)
    logger.debug(`ZIP file copied to temp location: ${paths.tempZipPath}`)

    await extract(paths.tempZipPath, { dir: paths.tempDir })
    logger.debug(`ZIP contents extracted to: ${paths.tempDir}`)

    try {
      await unlink(paths.tempZipPath)
      logger.debug('Temporary zip file cleaned up')
    } catch (error) {
      logger.warn('Failed to clean up temporary zip file:', error)
    }

    const execExists = await Bun.file(paths.execPath).exists()
    if (!execExists) {
      logger.error(`Chrome executable not found at expected path: ${paths.execPath}`)
      throw new Error('Chrome executable not found after extraction')
    }

    const execContent = await Bun.file(paths.execPath).arrayBuffer()
    await Bun.write(paths.execPath, execContent, { executable: true })
    logger.success(`Chrome binary made executable: ${paths.execPath}`)

    // Save new version
    await Bun.write(paths.versionFile, bundledVersion)
    logger.debug(`Version file updated: ${paths.versionFile}`)

    return true
  }
  catch (error) {
    logger.error('Failed during Chrome extraction:', error)
    throw error
  }
}

/**
 * Main function to extract Chrome to temp directory
 */
export async function extractChromeToTemp(
  bundlePaths: BundlePaths,
  extractionPaths?: ChromeExtractionPaths,
): Promise<string> {
  logger.info('Starting Chrome binary extraction process...')
  logger.debug('Bundled Chrome ZIP path:', bundlePaths.zipPath)
  logger.debug('Bundled version file path:', bundlePaths.versionPath)

  // Define paths if not provided
  const paths = extractionPaths || getChromeExtractionPaths()

  logger.debug('Paths being used:')
  logger.debug('- Temp directory:', paths.tempDir)
  logger.debug('- Version file:', paths.versionFile)
  logger.debug('- Executable path:', paths.execPath)
  logger.debug('- Temporary ZIP:', paths.tempZipPath)

  await mkdir(paths.tempDir, { recursive: true })
  logger.success('Temp directory created/verified')

  // Get bundled version if not provided in extraction paths
  const bundledVersion = paths.version || await Bun.file(bundlePaths.versionPath).text()
  logger.info('Bundled Chrome version:', bundledVersion.trim())

  // Check if we can use a previously unbundled Chrome binary
  const canReuse = await canReuseExistingChrome(paths, bundledVersion)
  if (canReuse) {
    return paths.execPath
  }

  // Extract new version
  logger.start('Extracting new Chrome version...')
  await extractChromeZip(bundlePaths.zipPath, paths, bundledVersion)

  return paths.execPath
}
