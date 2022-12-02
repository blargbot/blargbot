import { SourceMarker } from './SourceMarker.js';
import { Statement } from './Statement.js';

export interface SubtagCall {
    readonly name: Statement;
    readonly args: readonly Statement[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
