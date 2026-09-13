export type LichessPlayer = {
  user?: { id?: string; name?: string; title?: string };
  userId?: string;
  name?: string;
  rating?: number;
  ratingDiff?: number;
  aiLevel?: number;
  analysis?: {
    inaccuracy?: number;
    mistake?: number;
    blunder?: number;
    acpl?: number;
    accuracy?: number;
    phases?: { opening?: number; middlegame?: number; endgame?: number };
  };
};

export type LichessGame = {
  id: string;
  rated?: boolean;
  variant?: string;
  speed?: string;
  perf?: string;
  createdAt: number;
  lastMoveAt?: number;
  turns?: number;
  status?: string;
  winner?: "white" | "black";
  players: { white: LichessPlayer; black: LichessPlayer };
  moves?: string;
  pgn?: string;
  opening?: { eco?: string; name?: string; ply?: number };
  accuracy?: { white?: number; black?: number };
  analysis?: Array<{
    eval?: number;
    mate?: number;
    best?: string;
    variation?: string;
    judgment?: { name?: string; comment?: string };
  }>;
};

export type LichessAccount = {
  id: string;
  username: string;
  perfs?: Record<string, { games?: number; rating?: number; rd?: number; prog?: number }>;
};
