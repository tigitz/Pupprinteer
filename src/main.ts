import { Command } from "commander";
import puppeteer, { PDFOptions } from "puppeteer-core";
import { resolve } from "path";
import { logger } from './logger';
import { extractChromeToTemp } from "./asset-utils";
import { parsePDFOptions } from "./pdf-options";
import filenamifyUrl from "filenamify-url";

import chromeArchive from "../chrome/chrome.zip" with { type: "file" };
import chromeVersion from "../chrome/version.txt" with { type: "file" };

let chromeBinary: string;

const program = new Command();

program
  .name('Pupprinteer')
  .description('Convert HTML to PDF using Puppeteer as a single standalone binary')
  .version('0.0.1')
  .requiredOption('-i, --input <path>', 'Path to local HTML file or remote URL to convert')
  .option('-o, --output <path>', 'Destination path where the PDF file will be saved')
  .option('-v, --verbose', 'Enable detailed debug logging output', false)
  .option(
    '-e, --chrome-executable <path>',
    'Custom Chrome browser executable path (uses bundled Chrome if not specified)',
  )
  .option(
    '-w, --wait <milliseconds>',
    'Additional time to wait in milliseconds after page load completes',
    '0'
  )
  .option(
    '-p, --pdf-settings <json>',
    'Base PDF settings as JSON (will be overridden by specific options)',
    '{"margin": {"top": "0", "right": "0", "bottom": "0", "left": "0"}, "printBackground": true, "format": "a4"}'
  )
  // PDF-specific options
  .option('--scale <number>', 'Scale of the webpage rendering')
  .option('--displayHeaderFooter', 'Display header and footer')
  .option('--headerTemplate <string>', 'HTML template for the print header')
  .option('--footerTemplate <string>', 'HTML template for the print footer')
  .option('--printBackground', 'Print background graphics')
  .option('--landscape', 'Paper orientation')
  .option('--pageRanges <string>', 'Paper ranges to print, e.g., 1-5, 8, 11-13')
  .option('--format <string>', 'Paper format (letter, legal, tabloid, ledger, a0-a6)')
  .option('--width <string>', 'Paper width, accepts values labeled with units')
  .option('--height <string>', 'Paper height, accepts values labeled with units')
  .option('--preferCSSPageSize', 'Give any CSS @page size declared in the page priority')
  .option('--margin <string>', 'Paper margins, format: "top,right,bottom,left" in pixels or with units')
  .option('--omitBackground', 'Hide default white background')
  .option('--timeout <number>', 'Timeout in milliseconds')

async function main(): Promise<void> {
  try {
    program.parse();
    const options = program.opts();

    logger.setVerbose(options.verbose);

    logger.info('Starting Chrome binary initialization...');
    chromeBinary = await extractChromeToTemp(chromeArchive, chromeVersion);

    logger.info('Starting PDF generation process');
    logger.debug('Parsed options:\n', options);

    const baseSettings: PDFOptions = JSON.parse(options.pdfSettings);
    const specificOptions = parsePDFOptions(options);
    const finalSettings = {
      ...baseSettings,
      ...specificOptions
    };

    const pdfService = new PdfService(options.executable || chromeBinary);
    await pdfService.generatePdf(
      options.input,
      options.output,
      finalSettings,
      options.wait ? parseInt(options.wait) : 0
    );
  } catch (error) {
    logger.error('Error generating PDF:', error);
    process.exit(1);
  }
}

main();
