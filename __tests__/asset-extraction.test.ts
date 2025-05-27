import type { ChromeExtractionPaths } from '../src/asset-utils.ts'
import { mkdir, unlink } from 'node:fs/promises'
import os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  canReuseExistingChrome,

  extractChromeToTemp,
  extractChromeZip,
  getChromeExtractionPaths,
} from '../src/asset-utils.ts'
import { cleanupTestDirectory, createTestDirectory, createTestVersionFile } from './helpers/test-utils.ts'

describe('Asset Extraction Utilities', () => {
  let testDir: string

  const fixtureZipPath = path.join(__dirname, '..', 'fixtures', 'chrome-linux.zip')

  beforeEach(() => {
    testDir = createTestDirectory('chrome-extract-test')
  })

  afterEach(() => {
    cleanupTestDirectory(testDir)
  })

  describe('getChromeExtractionPaths', () => {
    it('should return correct paths with default temp directory', () => {
      const paths = getChromeExtractionPaths()

      expect(paths.tempDir).toBe(path.join(os.tmpdir(), 'pupprinteer-chrome'))
      expect(paths.versionFile).toBe(path.join(os.tmpdir(), 'pupprinteer-chrome', 'version.txt'))
      expect(paths.tempZipPath).toBe(path.join(os.tmpdir(), 'pupprinteer-chrome', 'chrome-temp.zip'))
    })

    it('should return correct paths with custom temp directory', () => {
      const customDir = path.join(os.tmpdir(), 'custom-chrome-dir')
      const paths = getChromeExtractionPaths(customDir)

      expect(paths.tempDir).toBe(customDir)
      expect(paths.versionFile).toBe(path.join(customDir, 'version.txt'))
      expect(paths.tempZipPath).toBe(path.join(customDir, 'chrome-temp.zip'))
    })
  })

  describe('canReuseExistingChrome', () => {
    it('should return false when version file does not exist', async () => {
      const paths = getChromeExtractionPaths(testDir)
      const result = await canReuseExistingChrome(paths, '123.0.0.0')

      expect(result).toBe(false)
    })

    it('should return false when versions do not match', async () => {
      const paths = getChromeExtractionPaths(testDir)
      createTestVersionFile(testDir, '122.0.0.0')

      const result = await canReuseExistingChrome(paths, '123.0.0.0')

      expect(result).toBe(false)
    })

    it('should return false when executable does not exist', async () => {
      const paths = getChromeExtractionPaths(testDir)
      createTestVersionFile(testDir, '123.0.0.0')

      const result = await canReuseExistingChrome(paths, '123.0.0.0')

      expect(result).toBe(false)
    })

    it('should return true when version matches and executable exists', async () => {
      const paths = getChromeExtractionPaths(testDir)
      createTestVersionFile(testDir, '123.0.0.0')

      // Create mock executable
      const platform = process.platform
      const execName = platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'
      const folderName = platform === 'win32' ? 'chrome-headless-shell-win64' : 'chrome-headless-shell-linux64'
      const execPath = path.join(testDir, folderName, execName)

      await mkdir(path.dirname(execPath), { recursive: true })
      await Bun.write(execPath, 'mock executable content')

      const result = await canReuseExistingChrome(paths, '123.0.0.0')

      expect(result).toBe(true)
    })
  })

  describe('extractChromeZip', () => {
    beforeEach(() => {
      // Ensure temp zip path doesn't exist before each test
      if (Bun.file(path.join(testDir, 'chrome-temp.zip')).size) {
        Bun.write(path.join(testDir, 'chrome-temp.zip'), '')
      }
    })

    afterEach(async () => {
      // Clean up any temp zip files after each test
      try {
        const tempZipPath = path.join(testDir, 'chrome-temp.zip')
        if (await Bun.file(tempZipPath).exists()) {
          await unlink(tempZipPath)
        }
      }
      catch (error) {
        console.error('Failed to clean up temp zip file:', error)
      }
    })

    it('should throw error when zip file does not exist and no existing installation', async () => {
      const paths = getChromeExtractionPaths(testDir)
      const nonExistentZipPath = path.join(testDir, 'non-existent.zip')

      await expect(extractChromeZip(nonExistentZipPath, paths, '123.0.0.0')).rejects.toThrow('Chrome ZIP not found')
    })

    it('should extract zip file and create version file', async () => {
      const paths = getChromeExtractionPaths(testDir)

      const result = await extractChromeZip(fixtureZipPath, paths, '123.0.0.0')

      expect(result).toBe(true)

      // Check version file was created
      const versionContent = await Bun.file(paths.versionFile).text()
      expect(versionContent).toBe('123.0.0.0')
    })
  })

  describe('extractChromeToTemp', () => {
    it('should reuse existing Chrome when versions match', async () => {
      // Setup existing Chrome
      const paths = getChromeExtractionPaths(testDir)
      createTestVersionFile(testDir, '123.0.0.0')

      // Create mock executable
      const platform = process.platform
      const execName = platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'
      const folderName = platform === 'win32' ? 'chrome-headless-shell-win64' : 'chrome-headless-shell-linux64'
      const execPath = path.join(testDir, folderName, execName)

      await mkdir(path.dirname(execPath), { recursive: true })
      await Bun.write(execPath, 'mock executable content')

      // Create version file for test
      const versionPath = path.join(testDir, 'version.txt')
      await Bun.write(versionPath, '123.0.0.0')

      const extractionPaths: ChromeExtractionPaths = {
        ...paths,
        version: '123.0.0.0',
      }

      const result = await extractChromeToTemp(
        { zipPath: fixtureZipPath, versionPath },
        extractionPaths,
      )

      expect(result).toBe(paths.execPath)
    })

    it('should extract new Chrome when versions do not match', async () => {
      // Setup existing Chrome with different version
      const paths = getChromeExtractionPaths(testDir)
      createTestVersionFile(testDir, '122.0.0.0')

      // Create version file for test with newer version
      const versionPath = path.join(testDir, 'bundled-version.txt')
      await Bun.write(versionPath, '123.0.0.0')

      const extractionPaths: ChromeExtractionPaths = {
        ...paths,
        version: '123.0.0.0',
      }

      const result = await extractChromeToTemp(
        { zipPath: fixtureZipPath, versionPath },
        extractionPaths,
      )

      expect(result).toBe(paths.execPath)

      // Check version file was updated
      const versionContent = await Bun.file(paths.versionFile).text()
      expect(versionContent).toBe('123.0.0.0')
    })
  })
})
