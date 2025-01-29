import type {PDFOptions} from 'puppeteer-core';

export function parseMarginOption(marginStr: string): PDFOptions['margin'] {
  const margins = marginStr.split(',');
  if (margins.length !== 4) {
    throw new Error('Margin must be specified as "top,right,bottom,left"');
  }
  return {
    top: margins[0],
    right: margins[1],
    bottom: margins[2],
    left: margins[3]
  };
}

export async function parsePDFOptions(options: any): Promise<PDFOptions> {
  const pdfOptions: PDFOptions = {};

  if (options.scale) pdfOptions.scale = Number(options.scale);
  if (options['display-header-footer'] !== undefined) pdfOptions.displayHeaderFooter = options['display-header-footer'];
  if (options['header-template']) pdfOptions.headerTemplate = await Bun.file(options['header-template']).text();
  if (options['footer-template']) pdfOptions.footerTemplate = await Bun.file(options['footer-template']).text();
  if (options['print-background'] !== undefined) pdfOptions.printBackground = options['print-background'];
  if (options.landscape !== undefined) pdfOptions.landscape = options.landscape;
  if (options['page-ranges']) pdfOptions.pageRanges = options['page-ranges'];
  if (options.format) pdfOptions.format = options.format;
  if (options.width) pdfOptions.width = options.width;
  if (options.height) pdfOptions.height = options.height;
  if (options['prefer-css-page-size'] !== undefined) pdfOptions.preferCSSPageSize = options['prefer-css-page-size'];
  if (options.margin) pdfOptions.margin = parseMarginOption(options.margin);
  if (options['omit-background'] !== undefined) pdfOptions.omitBackground = options['omit-background'];
  if (options.waitAfterPageLoad) pdfOptions.timeout = Number(options.waitAfterPageLoad);

  return pdfOptions;
}
