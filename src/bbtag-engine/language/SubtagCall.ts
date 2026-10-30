import type { SourceMarker } from './SourceMarker.js';
import type { BBTagExpression } from './Statement.js';

export interface SubtagCall {
    readonly name: BBTagExpression;
    readonly args: readonly BBTagExpression[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
