import type { BBTagExpression } from './BBTagExpression.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagSubtag {
    readonly name: BBTagExpression;
    readonly args: readonly BBTagExpression[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
