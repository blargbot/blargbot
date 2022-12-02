import { SourceMarker } from './SourceMarker.js';
import { SubtagCall } from './SubtagCall.js';

export interface Statement {
    readonly values: ReadonlyArray<string | SubtagCall>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
