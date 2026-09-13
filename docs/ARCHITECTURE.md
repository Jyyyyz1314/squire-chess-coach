# 架构说明

Squire 把确定性的棋局能力和概率性的语言模型能力分开：

```text
浏览器
├─ chess.js               合法走子、PGN 回放
├─ Stockfish Web Worker   本地分析，不上传棋局
└─ React UI               棋盘、招法、笔记、讲解
          ├─ 仅在用户请求老师时
          ▼
/api/coach
├─ Zod 输入边界
├─ 同源校验、限流、缓存、并发请求合并
├─ CoachProvider 接口
└─ OpenAI-compatible /chat/completions

浏览器 ── /api/lichess/auth/* ── Lichess OAuth2 PKCE
        └─ /api/lichess/games   ── 最近棋局 NDJSON
                    │
                    └─ 浏览器内 PlayerProfile 画像与本地缓存
```

## 稳定接口

- `StockfishAdapter.analyze(fen, options)`：引擎可替换边界。
- `CoachProvider.explain(context)`：模型供应商可替换边界。
- `SavedStudy` version 1：只保存 PGN、逐步笔记和保存时间，不保存模型回答。
- `Evaluation`：明确区分兵值与将杀，避免把 `#-2` 错当成 `-2.00`。
- `LichessGame` / `buildPlayerProfile`：隔离第三方棋局协议与可测试的画像计算。

## Lichess 数据边界

OAuth access token 由 AES-GCM 加密后写入 HttpOnly、SameSite Cookie，前端 JavaScript 无法读取。PKCE verifier 和 state 使用十分钟短期 Cookie，回调会核对 state 后再换取 token。同步接口最多读取最近 100 盘，当前 UI 固定为 60 盘；服务端限制响应体积，前端只把棋局和画像缓存到当前浏览器。

棋风属于走法行为统计。行棋质量优先采用 Lichess 的官方 `accuracy`，缺失时只对已有 `analysis` 中的失误标签作保守估算；两者都缺失时显示“样本不足”，不生成伪精确分数。

## 生产环境差异

当前限流与回答缓存为单实例内存实现，适合原型和单机部署。多实例商业部署必须换成 Durable Object、KV/Redis 或网关级限流，并加入账户、套餐配额、成本指标和滥用处置。适配层不应让这些变化渗入棋盘组件。

## 下一步拆分

`app/page.tsx` 仍承担较多界面状态。后续按 `StudyWorkspace`、`BoardPanel`、`EnginePanel`、`CoachPanel` 和 `ImportDialog` 拆分，并把持久化迁移到带版本升级的仓储接口。
