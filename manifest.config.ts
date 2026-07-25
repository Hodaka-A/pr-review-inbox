import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "PR Review Inbox",
  version: pkg.version,
  description:
    "自分が出した open な PR に届いたレビューコメントをまとめて確認できます。",
  icons: {
    48: "pr_comment_icon.png",
  },
  action: {
    default_icon: {
      48: "pr_comment_icon.png",
    },
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
  },
  permissions: ["storage", "nativeMessaging", "idle"],
});
