import { describe, expect, it } from 'bun:test'
import { prepareLaunchOptions } from '../src/puppeteer.ts'

// We need to expose the prepareLaunchOptions function for testing
// This is a workaround since we can't modify the original file

describe('prepareLaunchOptions', () => {
  it('should handle undefined slowMo and debugPort', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
    }

    const result = prepareLaunchOptions(options)

    expect(result.slowMo).toBeUndefined()
    expect(result.debuggingPort).toBeUndefined()
  })

  it('should handle empty string slowMo and debugPort', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
      slowMo: '',
      debugPort: '',
    }

    const result = prepareLaunchOptions(options)

    expect(result.slowMo).toBeUndefined()
    expect(result.debuggingPort).toBeUndefined()
  })

  it('should parse numeric slowMo and debugPort', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
      slowMo: '100',
      debugPort: '9222',
    }

    const result = prepareLaunchOptions(options)

    expect(result.slowMo).toBe(100)
    expect(result.debuggingPort).toBe(9222)
  })

  it('should flip headless when headful is true', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
      headful: true,
    }

    const result = prepareLaunchOptions(options)

    expect(result.headless).toBe(false)
  })

  it('should set headless to true when headful is false', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
      headful: false,
    }

    const result = prepareLaunchOptions(options)

    expect(result.headless).toBe(true)
  })

  it('should pass through devtools option', () => {
    const options = {
      chromeExecutable: '/path/to/chrome',
      devtools: true,
    }

    const result = prepareLaunchOptions(options)

    expect(result.devtools).toBe(true)
  })
})
