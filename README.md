# Pupprinteer

A powerful standalone binary tool that exposes the full power of Puppeteer's HTML to PDF/image conversion capabilities in a seamless cross-platform CLI. It bundles Puppeteer and Chrome Headless for converting HTML to PDF or images without external dependencies, making it ideal for local usage.

## Features

- Single binary distribution - no need to install Node.js, Chrome, or any other dependencies
- Supports both local HTML files and remote URLs as input
- Generate PDFs or screenshots (PNG, JPEG, WebP)
- Custom CSS and JavaScript injection
- Full access to Puppeteer's powerful customization options:
  - Fine-grained PDF layout control (margins, headers/footers, page size)
  - Screenshot format and quality settings
  - Page rendering options (scale, background handling)
- Cross-platform support (Windows, Linux, macOS)
- Detailed logging options

## Installation

Download the latest release for your platform from the [releases page](https://github.com/keesystem/pupprinteer/releases).

The binary is self-contained and requires no additional installation steps.

## Usage

Pupprinteer has two main commands: `pdf` and `screenshot`.

### PDF Generation

Converting a URL to PDF:
```bash
./pupprinteer pdf -i https://example.com -o example.pdf
```

### Screenshot Generation

Capture a screenshot of a webpage:
```bash
./pupprinteer screenshot -i https://example.com -o screenshot.jpg --type jpeg --quality 90
```

### Common Options

Required:
- `-i, --input <path>` - Path to local HTML file or remote URL to convert

Optional:
- `-o, --output <path>` - Destination path where the output file will be saved
- `-v, --verbose` - Enable detailed debug logging output
- `-q, --quiet` - Disable all logging output
- `-e, --chrome-executable <path>` - Custom Chrome browser executable path
- `-w, --wait-after-page-load <milliseconds>` - Additional time to wait after page load completes
- `--inject-js <path>` - Path to JavaScript file or URL to inject after page load
- `--inject-css <path>` - Path to CSS file or URL to inject after page load
- `--headful` - Launch Chrome in headful mode (non-headless)
- `--devtools` - Auto-open DevTools panel

### PDF Command Options

- `--scale <number>` - Scale of the webpage rendering
- `--display-header-footer` - Display header and footer
- `--header-template <path>` - Path to HTML template file or URL for the print header
- `--footer-template <path>` - Path to HTML template file or URL for the print footer
- `--print-background` - Print background graphics
- `--landscape` - Paper orientation
- `--page-ranges <string>` - Paper ranges to print (e.g., "1-5, 8, 11-13")
- `--format <string>` - Paper format (letter, legal, tabloid, ledger, a0-a6)
- `--width <string>` - Paper width, accepts values labeled with units
- `--height <string>` - Paper height, accepts values labeled with units
- `--prefer-css-page-size` - Give any CSS @page size declared in the page priority
- `--margin <string>` - Paper margins, format: "top,right,bottom,left" in pixels or with units
- `--omit-background` - Hide default white background

### Screenshot Command Options

- `--full-page` - Capture the full scrollable page, not just the viewport (default: true)
- `--quality <number>` - JPEG/WebP quality (0-100), only applies when type is jpeg or webp
- `--type <type>` - Screenshot type: jpeg, png, or webp (default: png)
- `--omit-background` - Make background transparent if possible
- `--clip <string>` - Clip area of the page, format: "x,y,width,height"
- `--optimize-for-speed` - Optimize for speed instead of quality

## How It Works

Pupprinteer bundles Chrome Headless Shell (a minimal version of Chrome optimized for automation) directly into the binary during the build process. When executed, it:

1. Extracts the bundled Chrome binary to your system's temporary directory
2. Uses this extracted Chrome instance with Puppeteer to generate PDFs or screenshots
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
