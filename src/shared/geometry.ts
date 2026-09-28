/** A point, in whatever units its context draws in (px, squares, a viewBox's). */
export type Point = readonly [x: number, y: number];

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

/** Room kept free on each side, in px (a chart's, around its plot). */
export interface Padding {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
