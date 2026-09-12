# 架构说明

Squire 把确定性的棋局能力和概率性的语言模型能力分开：

```text
浏览器
├─ chess.js               合法走子、PGN 回放
├─ Stockfish Web Worker   本地分析，不上传棋局
└─ React UI               棋盘、招法、笔记、讲解
          │ 仅在用户请求老师时
          ▼
/api/coach
├─ Zod 输入边界
├─ 同源校验、限流、缓存、并发请求合并
├─ CoachProvider 接口
└─ OpenAI-compatible /chat/completions
```

## 稳定接口

- `StockfishAdapter.analyze(fen, options)`：引擎可替换边界。
- `CoachProvider.explain(context)`：模型供应商可替换边界。
- `SavedStudy` version 1：只保存 PGN、逐步笔记和保存时间，不保存模型回答。
- `Evaluation`：明确区分兵值与将杀，避免把 `#-2` 错当成 `-2.00`。

## 生产环境差异

当前限流与回答缓存为单实例内存实现，适合原型和单机部署。多实例商业部署必须换成 Durable Object、KV/Redis 或网关级限流，并加入账户、套餐配额、成本指标和滥用处置。适配层不应让这些变化渗入棋盘组件。

## 下一步拆分

`app/page.tsx` 仍承担较多界面状态。后续按 `StudyWorkspace`、`BoardPanel`、`EnginePanel`、`CoachPanel` 和 `ImportDialog` 拆分，并把持久化迁移到带版本升级的仓储接口。
