# 参与开发

需要 Node.js 22.13 或更高版本。复制 `.env.example` 为 `.env.local` 后即可运行；AI 老师配置由每位用户在网页中填写，引擎与 PGN 功能无需 API 密钥。

```bash
npm ci
npm run dev
```

提交前请运行：

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

新增 PGN 能力时应补充一个最小、可公开的回归棋谱；新增模型字段时需要同步更新 Zod 校验、提示词和测试。不要提交真实用户棋谱、密钥、`.env.local`、构建目录或 `.run-check`。

保持一次提交只解决一个清晰问题。涉及保存格式、引擎协议或 API 响应的破坏性改动，应先在 Issue 中说明迁移方案。
