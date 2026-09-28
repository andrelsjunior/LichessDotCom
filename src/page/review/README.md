# Game Review: the domain

What the review knows, judges and says, apart from what it shows. Everything
here is pure but the engine wrapper (`engine/stockfish.ts`), and none of it
reads the page: the UI (`index.ts` and what it builds on) passes in the game
id, the coach, the language, the opening's name and the page's asset URL.

| Folder        | What it holds                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chess/`      | `uciToSan`, `normalizeUci` (Lichess's king-takes-rook castling in the engine's terms), piece values, `isHanging`, `isSacrifice`                              |
| `evaluation/` | `PositionRecord` (a position's evaluation from White's view, also the cache's format), win probability, move accuracy, `formatEval`, `barLabel`              |
| `engine/`     | `Stockfish` (Lichess's own build, one search at a time), UCI output parsing, `toRecord`, the cloud's answers (`CloudEvalSchema`, `fromCloud`), search limits |
| `classes/`    | The move classes (`MoveClass`), their colors, sets (`GOOD`, `GRAPH_DOTS`…), ranks, coach moods and icons (`classSvg`, `classImage`, `classIcon`)             |
| `judge/`      | `judge` (one move, from its two positions' records), `mateVerdict`, `SURE_MATE`, the summary's `playerAccuracy` and `classCounts`                            |
| `rating/`     | The Game Rating: `model.json` (written by `tools/game-rating/fit.py`), Lichess's `divide`, `isTactical`, the odds, `rateGame`                                |
| `coach/`      | The coach's words: `remark`, `trajectory`, `fact`, `explanation`, seeded by `CoachContext`                                                                   |
| `comment/`    | The comment's `[[…]]` tokens, `commentMarkup` (the typing's words at a given moment), `streamFor`, `verdictTitle`                                            |
| `i18n/`       | `ReviewLanguage`: every string, sentence and grammar rule, in `en` and `fr`; `pageLanguage()` picks one                                                      |

## The main types

- `PositionRecord`: `{ cp | mate, wp, wp2, best }`, White's view; `toRecord`
  makes one from an `EngineResult` (the engine's, or `fromCloud`'s).
- `JudgeInput` → `judge` → `MoveReview`: the class, the win probability lost
  (`loss`), `accuracy`, the engine's `best` / `bestSan`, both records, both
  positions and the opponent's `previousMove`. Judge a game's moves in order,
  each with the one before; to relink a move to a later-judged previous move,
  spread it (`{ ...move, previousMove }`): a review is immutable.
- `GameRatingInput` → `rateGame` → `GameRating`: per color, `{ elo, phases }`,
  or null for a player without a move.
- `CoachContext` (`gameId`, `coach`, `language`) → `explanation(move, context,
opening)` → `CommentPart[]`: sentences, the droppable one going when the
  bubble lacks room.
- `StreamState` (`key`, `shown`, `dropped`): the typing's progress, kept by
  the UI. `streamFor(state, parts)` starts it over for a new comment;
  `commentMarkup(parts, { stream, assets, language })` draws the words.
