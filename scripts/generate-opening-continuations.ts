import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Chess } from "chess.js";
import { OPENING_THEORY_COURSES } from "../lib/chess/opening-variations";

const [engineArgument, outputArgument, targetArgument = "24"] = process.argv.slice(2);
if (!engineArgument || !outputArgument) {
  throw new Error("Usage: generate-opening-continuations <stockfish.cjs> <output.json> [target-plies]");
}

const enginePath = resolve(engineArgument);
const outputPath = resolve(outputArgument);
const targetPlies = Number.parseInt(targetArgument, 10);
const engine = spawn(process.execPath, [enginePath], { cwd: dirname(enginePath), stdio: ["pipe", "pipe", "inherit"] });
let buffer = "";
let waiting: ((move: string) => void) | undefined;

engine.stdout.setEncoding("utf8");
engine.stdout.on("data", (chunk: string) => {
  buffer += chunk;
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
    if (match && waiting) {
      const resolveMove = waiting;
      waiting = undefined;
      resolveMove(match[1].toLowerCase());
    }
  }
});

function bestMove(fen: string) {
  return new Promise<string>((resolveMove, reject) => {
    const timer = setTimeout(() => {
      waiting = undefined;
      reject(new Error(`Stockfish timed out for ${fen}`));
    }, 10_000);
    waiting = (move) => {
      clearTimeout(timer);
      resolveMove(move);
    };
    engine.stdin.write(`position fen ${fen}\ngo depth 7\n`);
  });
}

const generated: Record<string, string> = {};
engine.stdin.write("uci\nisready\nsetoption name Hash value 32\n");

for (const course of OPENING_THEORY_COURSES) {
  for (const variation of course.variations) {
    const game = new Chess();
    game.loadPgn(variation.pgn, { strict: false });
    while (game.history().length < targetPlies && !game.isGameOver()) {
      const uci = await bestMove(game.fen());
      const move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci[4] || "q") as "q" | "r" | "b" | "n",
      });
      if (!move) throw new Error(`Stockfish returned illegal move ${uci} for ${course.sampleId}/${variation.id}`);
    }
    generated[`${course.sampleId}/${variation.id}`] = game.pgn({ maxWidth: 0, newline: "\n" });
  }
}

engine.stdin.write("quit\n");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`, "utf8");
console.log(`Generated ${Object.keys(generated).length} fixed lines at ${targetPlies} plies.`);
