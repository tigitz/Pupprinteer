import type { Page } from 'puppeteer-core'
import type { FileExtension } from './types'
import { resolve } from 'node:path'
import filenamifyUrl from 'filenamify-url'
import { logger } from './logger'

/**
 * Loads content from either a local file or a remote URL
 * @param path Path to local file or remote URL
 * @returns The content as a string
 */
export async function loadContent(path: string): Promise<string> {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    logger.debug(`Loading content from URL: ${path}`)
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${path}, status: ${response.status}`)
      }
      return await response.text()
    }
    catch (error) {
      logger.error(`Error fetching from URL ${path}:`, error)
      throw error
    }
  }
  
  // Handle as local file
  logger.debug(`Loading content from file: ${path}`)
  try {
    return await Bun.file(path).text()
  }
  catch (error) {
    logger.error(`Error reading file ${path}:`, error)
    throw error
  }
}

export async function preparePage(
  page: Page,
  input: string,
  waitTime: number,
  injectJs?: string,
  injectCss?: string,
): Promise<void> {
  const url = input.startsWith('http://') || input.startsWith('https://')
    ? input
    : `file://${resolve(input)}`

  logger.start(`Navigation to: ${url}`)
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  })
  logger.success('Page loaded successfully')

  if (injectCss) {
    logger.start('Injecting custom CSS...')
    await page.addStyleTag({ content: injectCss })
  }

  if (injectJs) {
    logger.start('Injecting JavaScript...')
    await page.addScriptTag({ content: injectJs })
  }

  if (waitTime > 0) {
    logger.start(`Waiting for ${waitTime}ms...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
}

export function determineOutputPath(
  input: string,
  extension: FileExtension,
  output?: string,
): string {
  if (output) {
    return output
  }

  let outputPath: string

  if (input.startsWith('http://') || input.startsWith('https://')) {
    const urlFilename = filenamifyUrl(input)
    outputPath = `${urlFilename.slice(0, 196)}.${extension}`
  }
  else {
    const inputPath = resolve(input)
    const basename = inputPath.replace(/\.[^/.]+$/, '')
    outputPath = `${basename.slice(0, 196)}.${extension}`
  }

  logger.info(`No output path specified, using: ${outputPath}`)
  return outputPath
}
