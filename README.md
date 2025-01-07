# Pupprinteer

A standalone binary tool that bundles Puppeteer and Chrome Headless for converting HTML to PDF without external dependencies.

## Features

- Single binary distribution - no need to install Node.js, Chrome, or any other dependencies
- Supports both local HTML files and remote URLs as input
- Bundled Chrome Headless browser
- Customizable PDF output settings
- Cross-platform support (Windows, Linux, macOS)
- Detailed logging options

## Installation

Download the latest release for your platform from the [releases page](https://github.com/keesystem/pupprinteer/releases).

The binary is self-contained and requires no additional installation steps.

## Usage

Basic usage:
```bash
./pupprinteer -f input.html -o output.pdf
```

Converting a URL to PDF:
```bash
./pupprinteer -f https://example.com -o example.pdf
```

### Options

Required:
- `-f, --file <path>` - Path to local HTML file or remote URL to convert

Optional:
- `-o, --output <path>` - Destination path where the PDF file will be saved
- `-v, --verbose` - Enable detailed debug logging output
- `-e, --chrome-executable <path>` - Custom Chrome browser executable path
- `-t, --timeout <milliseconds>` - Additional time to wait after page load completes
- `-p, --pdf-settings <json>` - Base PDF settings as JSON (will be overridden by specific options)

PDF Settings Options:
- `--scale <number>` - Scale of the webpage rendering
- `--displayHeaderFooter` - Display header and footer
- `--headerTemplate <string>` - HTML template for the print header
- `--footerTemplate <string>` - HTML template for the print footer
- `--printBackground` - Print background graphics
- `--landscape` - Paper orientation
- `--pageRanges <string>` - Paper ranges to print (e.g., "1-5, 8, 11-13")
- `--format <string>` - Paper format (letter, legal, tabloid, ledger, a0-a6)
- `--width <string>` - Paper width, accepts values labeled with units
- `--height <string>` - Paper height, accepts values labeled with units
- `--preferCSSPageSize` - Give any CSS @page size declared in the page priority
- `--margin <string>` - Paper margins, format: "top,right,bottom,left" in pixels or with units
- `--omitBackground` - Hide default white background

## How It Works

Pupprinteer bundles Chrome Headless Shell (a minimal version of Chrome optimized for automation) directly into the binary during the build process. When executed, it:

1. Extracts the bundled Chrome binary to your system's temporary directory
2. Uses this extracted Chrome instance with Puppeteer to generate PDFs
3. Automatically manages the Chrome binary lifecycle

## Continuous Integration & Releases

The project uses GitHub Actions for automated builds and releases:

- Every commit to the `main` branch triggers a new build
- Successful builds automatically create GitHub releases
- Platform-specific binaries are attached as release assets:
  - Windows (x64)
  - Linux (x64)
  - macOS (x64 & ARM64)

## Building from Source

Requirements:
- [Bun](https://bun.sh/) runtime

Clone and build:
```bash
# Clone the repository
git clone https://github.com/yourusername/pupprinteer.git
cd pupprinteer

# Install dependencies
bun install

# Download Chrome Headless Shell
bun run build/chrome-download.ts
```

# Build for your platform
Windows:
```bash
bun build --compile --target=bun-windows-x64-modern --minify --sourcemap src/main.ts --outfile pupprinteer.exe
```

Linux:
```bash
bun build --compile --target=bun-linux-x64-modern --minify --sourcemap src/main.ts --outfile pupprinteer
```

The build process:
1. Downloads the appropriate Chrome Headless Shell version
2. Bundles it with the application code
3. Creates a self-contained binary for the target platform
