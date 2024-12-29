import { createConsola } from 'consola'

class Logger {
  private consola = createConsola({
    level: 3, // Default level
  });

  setVerbose(verbose: boolean): void {
    this.consola = createConsola({
      level: verbose ? 4 : 3, // Level 4 includes debug messages
    });
  }

  debug(...args: any[]): void {
    this.consola.debug(...args);
  }

  info(...args: any[]): void {
    this.consola.info(...args);
  }

  start(...args: any[]): void {
    this.consola.start(...args);
  }

  success(...args: any[]): void {
    this.consola.success(...args);
  }

  error(...args: any[]): void {
    this.consola.error(...args);
  }
}

// Create and export a single instance
export const logger = new Logger();
