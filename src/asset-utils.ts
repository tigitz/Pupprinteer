import { join } from "path";
import os from "os";
import { mkdir, unlink } from "node:fs/promises";
import extract from "extract-zip";
import { logger } from './logger';
import { detectPlatform, getChromeExecutablePath, getChromeFolderPath } from './chrome-utils';


export async function extractChromeToTemp(zipPath: string, versionPath: string): Promise<string> {
  logger.info('Starting Chrome binary extraction process...');
  logger.debug('Bundled Chrome ZIP path:', zipPath);
  logger.debug('Bundled version file path:', versionPath);

  // Define paths
  const tempDir = join(os.tmpdir(), 'pupprinteer-chrome');
  const versionFile = join(tempDir, 'version.txt');
  const platform = detectPlatform();
  const execPath = getChromeExecutablePath(tempDir, platform);
  const tempZipPath = join(tempDir, 'chrome-temp.zip');

  logger.debug('Paths being used:');
  logger.debug('- Temp directory:', tempDir);
  logger.debug('- Version file:', versionFile);
  logger.debug('- Executable path:', execPath);
  logger.debug('- Temporary ZIP:', tempZipPath);

  // Create temp directory if it doesn't exist
  try {
    await mkdir(tempDir, { recursive: true });
    logger.success('Temp directory created/verified');
  } catch (error) {
    logger.error('Failed to create temp directory:', error);
    throw error;
  }

  // Read bundled version
  const bundledVersion = await Bun.file(versionPath).text();
  logger.info('Bundled Chrome version:', bundledVersion.trim());

  // Check if we need to extract
  try {
    const previousVersion = await Bun.file(versionFile).text();
    logger.info('Found existing Chrome version:', previousVersion.trim());

    if (previousVersion.trim() === bundledVersion.trim()) {
      const execExists = await Bun.file(execPath).exists();
      if (execExists) {
        logger.success('Using existing Chrome binary - skipping extraction');
        return execPath;
      }
    }
  } catch (error) {
    logger.debug('No existing version found or error reading version file');
  }

  // Extract new version
  logger.start('Extracting new Chrome version...');
  try {
    // Copy ZIP to temp location
    const zipContent = await Bun.file(zipPath).arrayBuffer();
    await Bun.write(tempZipPath, zipContent);
    logger.debug(`ZIP file copied to temp location: ${tempZipPath}`);

    // Extract ZIP
    await extract(tempZipPath, { dir: tempDir });
    logger.debug(`ZIP contents extracted to: ${tempDir}`);

    // Cleanup temp ZIP
    await unlink(tempZipPath);

    // Make executable
    const execContent = await Bun.file(execPath).arrayBuffer();
    await Bun.write(execPath, execContent, { executable: true });
    logger.success(`Chrome binary made executable: ${execPath}`);

    // Save new version
    await Bun.write(versionFile, bundledVersion);
    logger.debug(`Version file updated: ${versionFile}`);

    return execPath;
  } catch (error) {
    logger.error('Failed during Chrome extraction:', error);
    throw error;
  }
}
