# Third-party notices

## Stockfish 18

`public/engine/stockfish.js` and `public/engine/stockfish.wasm` are the Stockfish.js 18.0.8 lite single-thread browser build. They run locally in the visitor's browser and communicate over UCI.

Stockfish is copyright © the Stockfish developers and is licensed under GPL-3.0-or-later. Its license text is included at [public/engine/COPYING.txt](public/engine/COPYING.txt). The corresponding upstream source is available from [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish); the browser build is distributed by [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js).

When distributing a build containing Stockfish, retain this notice, the license text, and the corresponding-source link. Obtain legal advice before making licensing decisions for a commercial distribution.

## Cburnett chess pieces

The SVG chess pieces in `public/pieces/cburnett/` are the Cburnett set by Colin M.L. Burnett, as distributed by the Lichess project. They are licensed under GPL-2.0-or-later. The license text is included at `public/pieces/cburnett/COPYING.txt`, and Lichess's asset attribution is available in its [official COPYING file](https://github.com/lichess-org/lila/blob/master/COPYING.md).

When distributing these assets, retain this notice, the license text, and the upstream attribution.

## Lichess chess openings data

The ECO identifiers, standard opening names, and representative move sequences used to prepare `lib/chess/opening-samples.ts` were checked against the [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) data set. The upstream collection is dedicated to the public domain under CC0-1.0. The Chinese teaching summaries and per-move notes in this project are original application content.
