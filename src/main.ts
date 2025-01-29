import { Command } from "@commander-js/extra-typings";
import type { PDFOptions } from "puppeteer-core";
import { logger } from './logger';
import { extractChromeToTemp } from "./asset-utils";
import { parsePDFOptions } from "./pdf-options";

import chromeArchive from "../chrome/chrome.zip" with { type: "file" };
import chromeVersion from "../chrome/version.txt" with { type: "file" };
import { PdfGenerator } from './pdf-generator';

let chromeBinary: string;

const program = new Command()
  .name('Pupprinteer')
  .description('Browser automation and conversion tools using Puppeteer')
  .version('0.0.1')
  .option('-v, --verbose', 'Enable detailed debug logging output', false)
  .option('--headful', 'Launch Chrome in headful mode (non-headless)', false)
  .option('--devtools', 'Auto-open DevTools panel', false)
  .option('--slowMo <milliseconds>', 'Slow down Puppeteer operations by specified milliseconds', '0')
  .option('--debug-port <port>', 'Chrome debugging port', '9222')
  .option(
    '-e, --chrome-executable <path>',
    'Custom Chrome browser executable path (uses bundled Chrome if not specified)',
  );

program.command('pdf')
  .description('Convert HTML to PDF. Most PDF options are taken from https://pptr.dev/api/puppeteer.pdfoptions')
  .requiredOption('-i, --input <path>', 'Path to local HTML file or remote URL to convert')
  .option('-o, --output <path>', 'Destination path where the PDF file will be saved')
  .option(
    '-w, --wait-after-page-load <milliseconds>',
    'Additional time to wait in milliseconds after page load completes',
    '0'
  )
  .option(
    '-p, --pdf-settings <path>',
    'Path to JSON file containing base PDF settings (will be overridden by specific options)'
  )
  // PDF-specific options
  .option('--scale <number>', 'Scale of the webpage rendering')
  .option('--display-header-footer', 'Display header and footer')
  .option('--header-template <path>', 'Path to HTML template file for the print header')
  .option('--footer-template <path>', 'Path to HTML template file for the print footer')
  .option('--print-background', 'Print background graphics')
  .option('--landscape', 'Paper orientation')
  .option('--page-ranges <string>', 'Paper ranges to print, e.g., 1-5, 8, 11-13')
  .option('--format <string>', 'Paper format (letter, legal, tabloid, ledger, a0-a6)')
  .option('--width <string>', 'Paper width, accepts values labeled with units')
  .option('--height <string>', 'Paper height, accepts values labeled with units')
  .option('--prefer-css-page-size', 'Give any CSS @page size declared in the page priority')
  .option('--margin <string>', 'Paper margins, format: "top,right,bottom,left" in pixels or with units')
  .option('--omit-background', 'Hide default white background')
  .option('--inject-js <path>', 'Path to JavaScript file to inject after page load')
  .option('--inject-css <path>', 'Path to CSS file to inject after page load')
  .action(async (options, command) => {
    const globalOpts = command.optsWithGlobals();
    await handlePdfCommand(options, globalOpts);
  });


async function handlePdfCommand(cmdOptions: any, globalOptions: any): Promise<void> {
    logger.setVerbose(globalOptions.verbose);

    if (globalOptions.chromeExecutable) {
      logger.debug('Using provided Chrome executable:', globalOptions.chromeExecutable);
      chromeBinary = globalOptions.chromeExecutable;
    } else {
      logger.debug('Starting Chrome binary initialization...');
      chromeBinary = await extractChromeToTemp(chromeArchive, chromeVersion);
    }

    logger.debug('Starting PDF generation process');
    logger.debug('Parsed options:\n', { ...cmdOptions, ...globalOptions });

    const basePdfSettings: PDFOptions = cmdOptions.pdfSettings
      ? JSON.parse(await Bun.file(cmdOptions.pdfSettings).text())
      : {};

    const specificPdfOptions = await parsePDFOptions(cmdOptions);
    const finalPdfSettings = {
      ...basePdfSettings,
      ...specificPdfOptions
    };

    const debugOptions = {
      headful: globalOptions.headful,
      devtools: globalOptions.devtools,
      slowMo: globalOptions.slowMo ? parseInt(globalOptions.slowMo) : undefined,
      debugPort: globalOptions.debugPort ? parseInt(globalOptions.debugPort) : undefined
    };

    const injectJs = cmdOptions.injectJs ? await Bun.file(cmdOptions.injectJs).text() : undefined;
    const injectCss = cmdOptions.injectCss ? await Bun.file(cmdOptions.injectCss).text() : undefined;

    const pdfService = new PdfGenerator(globalOptions.chromeExecutable || chromeBinary);
    await pdfService.generatePdf(
      cmdOptions.input,
      cmdOptions.output,
      finalPdfSettings,
      cmdOptions.waitAfterPageLoad ? parseInt(cmdOptions.waitAfterPageLoad) : 0,
      injectJs,
      injectCss,
      debugOptions
    );
}

async function main(): Promise<void> {
    await program.parseAsync();
}

main();
