// What the popups we place (the hover card, the tooltips) share.

/** A rectangle in window coordinates; a DOMRect is one. */
export interface Box {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

/** How close a popup may come to the window's edges, in px. */
export const EDGE_MARGIN = 8;
