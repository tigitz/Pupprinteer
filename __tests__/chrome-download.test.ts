import os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { getChromeDownloadPaths } from '../build/chrome-download.ts'

describe('Chrome Download Utilities', () => {
  describe('getChromeDownloadPaths', () => {
    it('should return correct paths with default output directory', () => {
      const paths = getChromeDownloadPaths()

      expect(paths.chromeDir).toBe(path.join(process.cwd(), 'chrome'))
      expect(paths.versionFile).toBe(path.join(process.cwd(), 'chrome', 'version.txt'))
      expect(paths.zipPath).toBe(path.join(process.cwd(), 'chrome', 'chrome.zip'))
    })

    it('should return correct paths with custom output directory', () => {
      const customDir = path.join(os.tmpdir(), 'test-chrome')
      const paths = getChromeDownloadPaths(customDir)

      expect(paths.chromeDir).toBe(customDir)
      expect(paths.versionFile).toBe(path.join(customDir, 'version.txt'))
      expect(paths.zipPath).toBe(path.join(customDir, 'chrome.zip'))
    })
  })
})
