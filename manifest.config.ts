import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  // pkg.name はパッケージ識別子なので、ストアやツールバーに出す表示名は別に持つ
  name: 'PR Review Inbox',
  version: pkg.version,
  description: '自分が出した open な PR に届いたレビューコメントをまとめて確認できます。',
  icons: {
    48: 'pr_comment_icon_white_64.png',
  },
  action: {
    default_icon: {
      48: 'pr_comment_icon_white_64.png',
    },
    default_popup: 'src/popup/index.html',
  },
  // トークンの保存にのみ chrome.storage を使う。
  // GitHub API は CORS を許可しているので host_permissions は不要
  permissions: ['storage'],
})
