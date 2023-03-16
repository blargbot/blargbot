import type { SourceMarker } from './SourceMarker.js';

export interface BBTagToken {
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
