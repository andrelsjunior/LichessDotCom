import { html, type SafeHtml } from '#shared/html.ts';
import { classIcon } from '#page/review/classes/icon-svg.ts';
import type { CoachContext } from '#page/review/coach/context.ts';
import { explanation } from '#page/review/coach/explanation.ts';
import { type CommentPart, commentMarkup, streamFor } from '#page/review/comment/markup.ts';
import { verdictTitle } from '#page/review/comment/title.ts';
import type { ReviewMove, Session } from '#page/review/session.ts';
import { evalChip } from './markup.ts';

// The bubble for a judged move: its icon, the verdict and the score, then
// the coach's comment, typed out.

/** The extension's base URL, set on <html> by the content script at document_start. */
const assetsUrl = (): string => document.documentElement.dataset.cdcAssets ?? '';

const coachContext = (session: Session, gameId: string): CoachContext => ({
  gameId,
  coach: session.coach.coach,
  language: session.language,
});

/** A book move's opening: its own, or else the game's. */
export const openingOf = (session: Session, move: ReviewMove): string =>
  move.opening ?? session.view.openingName;

export interface VerdictInput {
  readonly move: ReviewMove;
  readonly gameId: string;
  /** Explain's hint, in place of the comment; '' for none. */
  readonly hint: string;
}

/** The comment's words at the typing's current moment. */
function commentOf(session: Session, parts: readonly CommentPart[]): SafeHtml {
  const stream = streamFor(session.stream.state, parts);
  session.stream.state = stream;
  return commentMarkup(parts, { stream, assets: assetsUrl(), language: session.language });
}

export function verdictMarkup(session: Session, { move, gameId, hint }: VerdictInput): SafeHtml {
  const { language } = session;
  const parts = hint
    ? [{ text: hint, droppable: false }]
    : explanation(move, coachContext(session, gameId), openingOf(session, move));
  return html`<div class="cdc-bubble__row">${classIcon(move.cls)}
      <p class="cdc-bubble__title">${verdictTitle(move.cls, move.san, language)}</p>
      ${evalChip(move.after)}</div>
    <p class="cdc-bubble__sub">${commentOf(session, parts)}</p>`;
}
