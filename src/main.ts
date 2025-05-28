import { Command } from '@commander-js/extra-typings'
import { addDefaultOptions } from './command/global.ts'
import { buildPdfCommand } from './command/pdf'
import { buildScreenshotCommand } from './command/screenshot'

const program = new Command()
  .name('Pupprinteer')
  .description('Convert HTML to PDF or Image')
  .version('0.0.1')

addDefaultOptions(program)
  .addCommand(buildScreenshotCommand())
  .addCommand(buildPdfCommand())

async function main(): Promise<void> {
  await program.parseAsync()
}

main()
