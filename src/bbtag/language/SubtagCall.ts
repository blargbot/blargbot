import { SourceMarker } from './SourceMarker';
import { Statement } from './Statement';

export interface SubtagCall {
    readonly name: Statement;
    readonly args: readonly Statement[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
