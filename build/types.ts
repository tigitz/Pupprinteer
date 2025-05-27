interface DownloadInfo {
  platform: string
  url: string
}

interface Downloads {
  'chrome': DownloadInfo[]
  'chromedriver': DownloadInfo[]
  'chrome-headless-shell': DownloadInfo[]
}

interface Channel {
  channel: 'Stable' | 'Beta' | 'Dev' | 'Canary'
  version: string
  revision: string
  downloads: Downloads
}

interface Channels {
  Stable: Channel
  Beta: Channel
  Dev: Channel
  Canary: Channel
}

interface ChromeVersionsResponse {
  timestamp: string
  channels: Channels
}

export type { ChromeVersionsResponse }
