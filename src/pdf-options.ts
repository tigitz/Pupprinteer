import type { PaperFormat, PDFOptions } from 'puppeteer-core'

export function parseMarginOption(marginStr: string): PDFOptions['margin'] {
  const margins = marginStr.split(',')
  if (margins.length !== 4) {
    throw new Error('Margin must be specified as "top,right,bottom,left"')
  }
  return {
    top: margins[0],
    right: margins[1],
    bottom: margins[2],
    left: margins[3],
  }
}

interface PdfOptionInput {
  scale?: string
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
  landscape?: boolean
  pageRanges?: string
  format?: PaperFormat
  width?: string
  height?: string
  preferCssPageSize?: boolean
  margin?: string
  omitBackground?: boolean
  waitAfterPageLoad?: string
}

export async function parsePDFOptions(options: PdfOptionInput): Promise<PDFOptions> {
  const pdfOptions: PDFOptions = {}

  if (options.scale)
    pdfOptions.scale = Number(options.scale)
  if (options.displayHeaderFooter !== undefined)
    pdfOptions.displayHeaderFooter = options.displayHeaderFooter
  if (options.headerTemplate)
    pdfOptions.headerTemplate = await Bun.file(options.headerTemplate).text()
  if (options.footerTemplate)
    pdfOptions.footerTemplate = await Bun.file(options.footerTemplate).text()
  if (options.printBackground !== undefined)
    pdfOptions.printBackground = options.printBackground
  if (options.landscape !== undefined)
    pdfOptions.landscape = options.landscape
  if (options.pageRanges)
    pdfOptions.pageRanges = options.pageRanges
  if (options.format)
    pdfOptions.format = options.format
  if (options.width)
    pdfOptions.width = options.width
  if (options.height)
    pdfOptions.height = options.height
  if (options.preferCssPageSize !== undefined)
    pdfOptions.preferCSSPageSize = options.preferCssPageSize
  if (options.margin)
    pdfOptions.margin = parseMarginOption(options.margin)
  if (options.omitBackground !== undefined)
    pdfOptions.omitBackground = options.omitBackground
  if (options.waitAfterPageLoad)
    pdfOptions.timeout = Number(options.waitAfterPageLoad)

  return pdfOptions
}
