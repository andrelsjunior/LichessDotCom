import { createElement } from '#shared/dom.ts';

export interface OwnedElement {
  readonly element: HTMLElement;
  /** Just made: whatever was drawn into the last one is gone. */
  readonly isNew: boolean;
}

/**
 * One `<div>` of ours at the end of a Lichess container, made again when
 * Lichess replaces the container (a new page, a redrawn board).
 */
export function createOwnedElement(className: string): (parent: Element) => OwnedElement {
  let current: HTMLElement | null = null;
  return parent => {
    if (current?.parentNode === parent) return { element: current, isNew: false };
    current = createElement('div', { className });
    parent.append(current);
    return { element: current, isNew: true };
  };
}
