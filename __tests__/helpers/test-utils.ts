import * as fs from 'node:fs'
import os from 'node:os'
import * as path from 'node:path'

/**
 * Creates a temporary test directory with optional test files
 */
export function createTestDirectory(prefix = 'pupprinteer-test'): string {
  const testDir = path.join(os.tmpdir(), `${prefix}-${Date.now()}`)
  fs.mkdirSync(testDir, { recursive: true })
  return testDir
}

/**
 * Creates a test version file with the specified version
 */
export function createTestVersionFile(directory: string, version = '123.0.6312.58'): string {
  const versionPath = path.join(directory, 'version.txt')
  fs.writeFileSync(versionPath, version)
  return versionPath
}

/**
 * Creates a dummy zip file for testing
 */
export function createDummyZipFile(directory: string, name = 'chrome.zip'): string {
  const zipPath = path.join(directory, name)
  fs.writeFileSync(zipPath, 'test zip content')
  return zipPath
}

/**
 * Cleans up a test directory
 */
export function cleanupTestDirectory(directory: string): void {
  try {
    fs.rmSync(directory, { recursive: true, force: true })
  }
  catch (error) {
    console.error(`Failed to clean up test directory ${directory}:`, error)
  }
}
