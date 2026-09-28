import { html, type SafeHtml, setHtml } from '#shared/html.ts';
import type { Analysis } from '#page/lichess/analysis.ts';
import { judgeAt } from '#page/review/live/judging.ts';
import type { Session } from '#page/review/session.ts';
import { avatarMarkup } from './coach-avatar.ts';
import { bubbleTitle } from './markup.ts';
import { verdictMarkup } from './verdict.ts';

// The free analysis board: the coach judges the move on the board, over
// Lichess's own engine lines and move list.

function liveBubble(session: Session, analysis: Analysis): SafeHtml {
  const { live, language } = session;
  if (live.error) return bubbleTitle(live.error);
  if (!analysis.path) return bubbleTitle(language.ui.liveIntro);
  const move = judgeAt(live, analysis, analysis.path);
  if (!move) return bubbleTitle(language.ui.thinking);
  return verdictMarkup(session, { move, gameId: analysis.gameId, hint: '' });
}

export function renderLive(session: Session, analysis: Analysis): void {
  const { live, language } = session;
  const move = judgeAt(live, analysis, analysis.path);
  const bubble = liveBubble(session, analysis);
  const avatar = avatarMarkup(session.coach, {
    cls: live.error ? null : (move?.cls ?? null),
    at: analysis.path,
    label: language.ui.coach,
  });
  setHtml(
    session.elements.panel,
    html`<div class="cdc-coach">${avatar}<div class="cdc-bubble">${bubble}</div></div>`,
  );
}
