import { PDFOptions } from 'puppeteer-core';

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

export function parsePDFOptions(options: any): PDFOptions {
  const pdfOptions: PDFOptions = {};

  // Handle each option type
  if (options.scale) pdfOptions.scale = Number(options.scale);
  if (options.displayHeaderFooter !== undefined) pdfOptions.displayHeaderFooter = options.displayHeaderFooter;
  if (options.headerTemplate) pdfOptions.headerTemplate = options.headerTemplate;
  if (options.footerTemplate) pdfOptions.footerTemplate = options.footerTemplate;
  if (options.printBackground !== undefined) pdfOptions.printBackground = options.printBackground;
  if (options.landscape !== undefined) pdfOptions.landscape = options.landscape;
  if (options.pageRanges) pdfOptions.pageRanges = options.pageRanges;
  if (options.format) pdfOptions.format = options.format;
  if (options.width) pdfOptions.width = options.width;
  if (options.height) pdfOptions.height = options.height;
  if (options.preferCSSPageSize !== undefined) pdfOptions.preferCSSPageSize = options.preferCSSPageSize;
  if (options.margin) pdfOptions.margin = parseMarginOption(options.margin);
  if (options.omitBackground !== undefined) pdfOptions.omitBackground = options.omitBackground;
  if (options.timeout) pdfOptions.timeout = Number(options.timeout);

  return pdfOptions;
}
