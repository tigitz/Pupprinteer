import * as fs from 'fs';
import * as path from 'path';
import type { ChromeVersionsResponse } from './types.ts';
import { logger } from '../src/logger'
import { ChromePlatform, detectPlatform, getChromeExecutablePath } from '../src/chrome-utils';

async function getLatestChromeInfo(platform?: ChromePlatform): Promise<{ version: string; downloadUrl: string; platform: ChromePlatform }> {
  const targetPlatform = platform || detectPlatform();
  logger.info('Fetching latest Chrome version info...');
  const response = await fetch('https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json');
  const data = await response.json() as ChromeVersionsResponse;

  const stableVersion = data.channels.Stable;
  if (!stableVersion) {
    throw new Error('No Stable Chrome version found');
  }

  const download = stableVersion.downloads['chrome-headless-shell'].find(d => d.platform === targetPlatform);

  if (!download) {
    throw new Error(`No download found for platform: ${targetPlatform}`);
  }

  return {
    version: stableVersion.version,
    downloadUrl: download.url,
    platform: targetPlatform
  };
}

function getChromeExecutablePath(platform: string): string {
  const chromeDir = path.join(process.cwd(), 'chrome');
  return platform === 'win64'
    ? path.join(chromeDir, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')
    : path.join(chromeDir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
}

async function chromeDownload(verbose = false, platform?: ChromePlatform): Promise<void> {
  const chromeDir = path.join(process.cwd(), 'chrome');
  const versionFile = path.join(chromeDir, 'version.txt');

  const { version, downloadUrl} = await getLatestChromeInfo();

  if (!fs.existsSync(chromeDir)) {
    fs.mkdirSync(chromeDir, { recursive: true });
  }
  logger.info(`Latest Chrome version: ${version}`);
  logger.info(`Downloading Chrome from: ${downloadUrl}`);

  const zipPath = path.join(chromeDir, 'chrome.zip');
  const zipResponse = await fetch(downloadUrl);
  const zipBuffer = await zipResponse.arrayBuffer();
  fs.writeFileSync(zipPath, Buffer.from(zipBuffer));
  logger.info(`Chrome archive saved to: ${zipPath}`);

  fs.writeFileSync(versionFile, version);
}

// When run directly, download Chrome
import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  (async () => {
    try {
      const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
      const platformArg = process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1];
      logger.setVerbose(verbose)
      await chromeDownload(verbose, platformArg as ChromePlatform);
      logger.success('Chrome downloaded successfully');
    } catch (error) {
      console.error('Failed to download Chrome:', error);
      process.exit(1);
    }
  })();
}

export { chromeDownload, getChromeExecutablePath };
