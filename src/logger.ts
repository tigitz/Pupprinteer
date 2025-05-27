import { createConsola } from 'consola'

class Logger {
  private consola = createConsola({
    level: 3, // Default level
  })

  setVerbose(verbose: boolean): void {
    this.consola = createConsola({
      level: verbose ? 4 : 3, // Level 4 includes debug messages
    })
  }

  setQuiet(quiet: boolean): void {
    this.consola = createConsola({
      level: quiet ? 0 : 3, // Level 0 disables all logging
    })
  }

  debug(...args: unknown[]): void {
    this.consola.debug(...args)
  }

  info(...args: unknown[]): void {
    this.consola.info(...args)
  }

  start(...args: unknown[]): void {
    this.consola.start(...args)
  }

  success(...args: unknown[]): void {
    this.consola.success(...args)
  }

  warn(...args: unknown[]): void {
    this.consola.warn(...args)
  }

  error(...args: unknown[]): void {
    this.consola.error(...args)
  }
}

// Create and export a single instance
export const logger = new Logger()
