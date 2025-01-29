import puppeteer, {type PDFOptions } from "puppeteer-core";
import { resolve } from "path";
import { logger } from './logger';
import filenamifyUrl from "filenamify-url";

export class PdfGenerator {
  constructor(private readonly chromeBinary: string) {}

  async generatePdf(
    input: string,
    output?: string,
    pdfSettings: PDFOptions = {},
    waitTime: number = 0,
    injectJs?: string,
    injectCss?: string,
    debugOptions?: {
      headful?: boolean;
      devtools?: boolean;
      slowMo?: number;
      debugPort?: number;
    }
  ): Promise<string> {
    logger.start('Launching browser...');

    const browser = await puppeteer.launch({
      executablePath: this.chromeBinary,
      headless: !debugOptions?.headful,
      devtools: debugOptions?.devtools,
      slowMo: debugOptions?.slowMo,
      args: debugOptions?.debugPort ? [`--remote-debugging-port=${debugOptions.debugPort}`] : undefined
    });

    try {
      logger.success('Browser launched successfully');
      logger.start('Opening new page...');
      const page = await browser.newPage();
      await page.setBypassCSP(true);

      const url = input.startsWith('http://') || input.startsWith('https://')
        ? input
        : `file://${resolve(input)}`;

      logger.start(`Navigation to: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      logger.success('Page loaded successfully');

      if (injectCss) {
        logger.start('Injecting custom CSS...');
        await page.addStyleTag({ content: injectCss });
      }

      if (injectJs) {
        logger.start('Injecting JavaScript...');
        await page.addScriptTag({ content: injectJs });
      }

      if (waitTime > 0) {
        logger.start(`Waiting for ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      let outputPath = output;
      if (!outputPath) {
        if (input.startsWith('http://') || input.startsWith('https://')) {
          const urlFilename = filenamifyUrl(input);
          outputPath = `${urlFilename.slice(0, 196)}.pdf`;
        } else {
          const inputPath = resolve(input);
          const basename = inputPath.replace(/\.[^/.]+$/, '');
          outputPath = `${basename.slice(0, 196)}.pdf`;
        }
        logger.info(`No output path specified, using: ${outputPath}`);
      }

      logger.debug('Using PDF settings:', pdfSettings);
      logger.start('Generating PDF...');
      await page.pdf({
        path: outputPath,
        ...pdfSettings
      });

      logger.success(`PDF generated successfully: ${outputPath}`);
      return outputPath;
    } finally {
      await browser.close();
    }
  }
}
