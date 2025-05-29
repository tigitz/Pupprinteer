import { join } from 'node:path'
import process from 'node:process'
import { logger } from './logger'

export type ChromePlatform = 'linux64' | 'mac-arm64' | 'mac-x64' | 'win32' | 'win64'

export function detectPlatform(): ChromePlatform {
  const platform = process.platform
  const arch = process.arch

  logger.debug(`Detecting platform - OS: ${platform}, Architecture: ${arch}`)

  if (platform === 'linux') {
    logger.debug('Detected platform: linux64')
    return 'linux64'
  }

  if (platform === 'darwin') {
    const macPlatform = arch === 'arm64' ? 'mac-arm64' : 'mac-x64'
    logger.debug(`Detected platform: ${macPlatform}`)
    return macPlatform
  }

  if (platform === 'win32') {
    const winPlatform = arch === 'x64' ? 'win64' : 'win32'
    logger.debug(`Detected platform: ${winPlatform}`)
    return winPlatform
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

export function getChromeExecutablePath(basePath: string, platform: ChromePlatform): string {
  const folderPath = getChromeFolderPath(basePath, platform)
  
  if (platform === 'win64' || platform === 'win32') {
    return join(folderPath, 'chrome-headless-shell.exe')
  }

  return join(folderPath, 'chrome-headless-shell')
}

export function getChromeFolderPath(basePath: string, platform: ChromePlatform): string {
  if (platform === 'win64' || platform === 'win32') {
    return join(basePath, 'chrome-headless-shell-win64')
  }
  
  if (platform === 'mac-arm64') {
    return join(basePath, 'chrome-headless-shell-mac-arm64')
  }
  
  if (platform === 'mac-x64') {
    return join(basePath, 'chrome-headless-shell-mac-x64')
  }

  return join(basePath, 'chrome-headless-shell-linux64')
}
