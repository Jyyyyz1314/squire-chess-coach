# Squire ♞

> 让每一步复盘，都有一位懂棋的老师在旁边。

![Squire — AI chess analysis](public/images/knight-hero.png)

Squire 是一款中文国际象棋复盘原型：浏览器内的 Stockfish 负责给出客观分数和候选变化，AI 老师负责解释计划、错误原因与可迁移的棋理，Lichess 同步则用近期实战建立棋风与进步画像。棋谱和个人笔记留在本地；只有主动请求老师时，当前局面与问题才会发送给你配置的模型服务。

![Squire 界面](public/images/readme-cover.png)

## 已实现

- Stockfish 18 WASM/Worker 自动分析当前每一步，显示 MultiPV、深度、兵值或将杀距离。
- 面向当前局面的快速点评、深入讲解与自由提问；提问回答经过第二次模型校验。
- 导入普通或带注释/变例的 Lichess PGN，也可直接粘贴棋谱文本。
- 导出/导入 Squire JSON 学习档案，保留逐步笔记且不保存模型回答。
- 10 个经典开局课程、每课 11 条变例（共 110 条）：提供固定中文理论、走法意图、典型计划与可追溯资料；独立训练区支持执白/执黑、教学/测试、提示、得分与偏离主线后的本地引擎陪练。
- Lichess OAuth2 + PKCE 安全登录、近期棋局同步、主动性/战术活跃/王的安全/开局纪律/行棋稳定/残局经验六维画像与一键复盘。
- 服务端输入校验、同源检查、超时重试、请求合并、短期缓存和基础限流。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
copy .env.example .env.local
npm run dev
```

不配置模型也可以使用棋盘、PGN、笔记和 Stockfish。连接 AI 老师时编辑 `.env.local`：

```env
COACH_BASE_URL=https://api.openai.com/v1
COACH_API_KEY=你的服务端密钥
COACH_MODEL=gpt-4.1-mini
COACH_API_ENABLED=true
COACH_RATE_LIMIT_PER_MINUTE=12
COACH_RATE_LIMIT_PER_DAY=120
```

修改配置后重启开发服务器。密钥只在服务端读取；不要使用 `NEXT_PUBLIC_` 前缀，也不要提交 `.env.local`。`COACH_BASE_URL` 支持服务根路径或完整的 `/chat/completions` 地址。

启用 Lichess 登录与棋手画像时，再加入：

```env
# 可留空；默认使用当前站点域名作为公开 OAuth client id
LICHESS_CLIENT_ID=
# 至少 32 个随机字符，只用于服务端加密 Lichess 访问令牌
LICHESS_SESSION_SECRET=请替换为随机长字符串
```

Lichess 使用无需客户端密钥的 OAuth2 PKCE。访问令牌只保存在加密、HttpOnly、SameSite Cookie 中；同步后的最多 60 盘棋局与画像缓存保存在当前浏览器。部署域名变化时需要让用户重新授权。

## 数据格式

标准对局使用 `.pgn`。带笔记的本地学习档案为 version 1 JSON：

```json
{
  "version": 1,
  "pgn": "1. e4 c6 2. d4 d5 *",
  "notes": { "3": "保持双兵中心，限制黑方反击。" },
  "savedAt": "2026-09-11T00:00:00.000Z"
}
```

## 架构与质量

核心边界是 `StockfishAdapter`、`CoachProvider`、`SavedStudy` 和类型化的 `Evaluation`。详细设计见 [架构说明](docs/ARCHITECTURE.md)。

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

GitHub Actions 会在每次提交和 Pull Request 上执行以上检查；Dependabot 每周检查 npm 依赖。测试已覆盖评分方向、AI 限流、Lichess 注释 PGN 和学习笔记导入。

## 商业化注意事项

当前版本是可演示原型，不应直接作为匿名公网收费服务。内存限流只保护单个实例；正式商用仍需账户/套餐、分布式配额、成本告警、隐私条款、模型质量评测和数据迁移策略。完整清单见 [商业化发布门槛](docs/COMMERCIALIZATION.md) 与 [安全策略](SECURITY.md)。

Stockfish 使用 GPLv3；Cburnett 棋子素材为 GPLv2+。分发义务与来源见 [第三方声明](THIRD_PARTY_NOTICES.md)。项目自身许可证尚未选定，在决定开源或闭源分发方案后再添加根目录 `LICENSE`。

## 参与开发

请阅读 [贡献指南](CONTRIBUTING.md) 和 [更新记录](CHANGELOG.md)。提交缺陷时可附最小 PGN/FEN，但请移除 API 密钥、私人棋谱和个人信息。
