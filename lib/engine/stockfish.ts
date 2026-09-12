export interface EngineLine { rank: number; depth: number; score: number; mate?: number; pv: string[] }
export interface EngineResult { fen: string; lines: EngineLine[] }
export interface EngineAdapter { analyze(fen: string, signal: AbortSignal): Promise<EngineResult> }
/** Browser-local Stockfish 18 (single-thread WASM) UCI adapter.
 * The worker and its sibling `stockfish.wasm` live in public/engine.
 * One dedicated worker per request makes cancellation and stale-position isolation explicit.
 */
export class StockfishAdapter implements EngineAdapter {
  analyze(fen: string, signal: AbortSignal): Promise<EngineResult> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const worker = new Worker('/engine/stockfish.js');
      const lines = new Map<number, EngineLine>();
      const cleanup = () => { clearTimeout(timer); worker.terminate(); signal.removeEventListener('abort', abort); };
      const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('引擎分析超时，请重试')); }, 30000);
      signal.addEventListener('abort', abort, { once: true });
      worker.onerror = () => { cleanup(); reject(new Error('引擎加载失败，请检查 public/engine 中的 Stockfish 资源')); };
      worker.onmessage = ({ data }) => {
        const text = String(data);
        if (text.includes('uciok')) { worker.postMessage('setoption name MultiPV value 3'); worker.postMessage('isready'); }
        if (text.includes('readyok')) { worker.postMessage('position fen ' + fen); worker.postMessage('go depth 14 movetime 2500'); }
        const m = text.match(/info depth (\d+).*?multipv (\d+).*?score (cp|mate) (-?\d+).*? pv (.+)/);
        if (m) {
          const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
          lines.set(+m[2], { rank: +m[2], depth: +m[1], score: +m[4] * sign / 100, ...(m[3] === 'mate' ? { mate: +m[4] * sign } : {}), pv: m[5].trim().split(' ') });
        }
        if (text.startsWith('bestmove')) { cleanup(); resolve({ fen, lines: [...lines.values()].sort((a,b) => a.rank-b.rank) }); }
      };
      worker.postMessage('uci');
    });
  }
}
