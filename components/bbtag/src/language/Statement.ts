import type { SourceMarker } from './SourceMarker.js';
import type { SubtagCall } from './SubtagCall.js';

export interface Statement {
    readonly values: ReadonlyArray<string | SubtagCall>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
