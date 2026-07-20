import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'pr_comment_icon_white_64.png',
  },
  action: {
    default_icon: {
      48: 'pr_comment_icon_white_64.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'contentSettings',
    'storage'
  ],
})
