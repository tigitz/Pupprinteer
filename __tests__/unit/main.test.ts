import { expect, test, describe } from "bun:test";
import { PdfService } from '../../src/pdf-service';
import { resolve } from 'path';
import { readFile, unlink } from 'fs/promises';

describe('PDF Generation', () => {
  test('should generate PDF from HTML file', async () => {
    // Setup
    const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
    const service = new PdfService(chromePath);
    const inputPath = resolve(__dirname, '../fixtures/hello.html');
    const outputPath = resolve(__dirname, '../fixtures/output.pdf');

    try {
      // Generate PDF
      const resultPath = await service.generatePdf(inputPath, outputPath);
      
      // Verify PDF was created
      const pdfContent = await readFile(outputPath);
      expect(pdfContent.length).toBeGreaterThan(0);
      expect(resultPath).toBe(outputPath);
      
      // Verify PDF starts with PDF magic number
      const pdfHeader = pdfContent.slice(0, 4).toString();
      expect(pdfHeader).toBe('%PDF');
    } finally {
      // Cleanup
      try {
        await unlink(outputPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
