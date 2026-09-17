import type { BBTagSubtag } from './BBTagSubtag.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagExpression {
    readonly values: ReadonlyArray<string | BBTagSubtag>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
