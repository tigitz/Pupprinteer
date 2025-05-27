import { Command } from '@commander-js/extra-typings'
import { buildDebugCommand } from './command/debug'
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
  .addCommand(buildDebugCommand())

async function main(): Promise<void> {
  await program.parseAsync()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
