import { afterEach, describe, expect, it } from 'bun:test'
import { detectPlatform, getChromeExecutablePath } from '../src/chrome-utils.ts'

describe('Platform detection', () => {
  const originalPlatform = process.platform
  const originalArch = process.arch

  afterEach(() => {
    // Reset mocked properties
    Object.defineProperty(process, 'platform', { value: originalPlatform })
    Object.defineProperty(process, 'arch', { value: originalArch })
  })

  it('should detect linux64 platform', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    Object.defineProperty(process, 'arch', { value: 'x64' })

    expect(detectPlatform()).toBe('linux64')
  })

  it('should detect mac-arm64 platform', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    Object.defineProperty(process, 'arch', { value: 'arm64' })

    expect(detectPlatform()).toBe('mac-arm64')
  })

  it('should detect mac-x64 platform', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    Object.defineProperty(process, 'arch', { value: 'x64' })

    expect(detectPlatform()).toBe('mac-x64')
  })

  it('should detect win64 platform', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
    Object.defineProperty(process, 'arch', { value: 'x64' })

    expect(detectPlatform()).toBe('win64')
  })

  it('should detect win32 platform', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
    Object.defineProperty(process, 'arch', { value: 'ia32' })

    expect(detectPlatform()).toBe('win32')
  })

  it('should throw error for unsupported platform', () => {
    Object.defineProperty(process, 'platform', { value: 'freebsd' })

    expect(() => detectPlatform()).toThrow('Unsupported platform')
  })
})

describe('Chrome executable path', () => {
  it('should return correct path for Windows', () => {
    const basePath = '/tmp/chrome'
    const path = getChromeExecutablePath(basePath, 'win64')
    expect(path.endsWith('chrome-headless-shell.exe')).toBe(true)
  })

  it('should return correct path for Linux', () => {
    const basePath = '/tmp/chrome'
    const path = getChromeExecutablePath(basePath, 'linux64')
    expect(path.endsWith('chrome-headless-shell')).toBe(true)
    expect(path).not.toContain('.exe')
  })
})
