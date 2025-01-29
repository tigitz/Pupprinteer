import { describe, expect, test } from 'bun:test'
import { parsePDFOptions } from '../../src/pdf-options'

describe('CLI Options Parsing', () => {
  test('should correctly parse margin options', async () => {
    const options = { margin: '10px,20px,30px,40px' }
    const result = await parsePDFOptions(options)
    expect(result.margin).toEqual({
      top: '10px',
      right: '20px',
      bottom: '30px',
      left: '40px',
    })
  })

  test('should throw on invalid margin format', async () => {
    const options = { margin: '10px,20px' }
    expect(parsePDFOptions(options)).rejects.toThrow('Margin must be specified as')
  })

  test('should parse numeric options correctly', async () => {
    const options = { scale: '1.5', waitAfterPageLoad: '1000' }
    const result = await parsePDFOptions(options)
    expect(result.scale).toBe(1.5)
    expect(result.timeout).toBe(1000)
  })
})
