import { logger } from './logger';
import { join } from "path";

export type ChromePlatform = 'linux64' | 'mac-arm64' | 'mac-x64' | 'win32' | 'win64';

export function detectPlatform(): ChromePlatform {
  const platform = process.platform;
  const arch = process.arch;

  logger.info(`Detecting platform - OS: ${platform}, Architecture: ${arch}`);

  switch (platform) {
    case 'linux':
      logger.info('Detected platform: linux64');
      return 'linux64';
    case 'darwin':
      const macPlatform = arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
      logger.info(`Detected platform: ${macPlatform}`);
      return macPlatform;
    case 'win32':
      const winPlatform = arch === 'x64' ? 'win64' : 'win32';
      logger.info(`Detected platform: ${winPlatform}`);
      return winPlatform;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function getChromeExecutablePath(basePath: string, platform: ChromePlatform): string {
  if (platform === 'win64' || platform === 'win32') {
    return join(getChromeFolderPath(basePath,platform ), 'chrome-headless-shell.exe');
  }
  return join(getChromeFolderPath(basePath,platform ), 'chrome-headless-shell-linux64', 'chrome-headless-shell');
}

export function getChromeFolderPath(basePath: string, platform: ChromePlatform): string {
  //@TODO handle mac too
  if (platform === 'win64' || platform === 'win32') {
    return join(basePath, 'chrome-headless-shell-win64');
  }
  return join(basePath, 'chrome-headless-shell-linux64');
}
