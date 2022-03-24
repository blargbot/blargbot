import { SourceMarker } from './SourceMarker';
import { SubtagCall } from './SubtagCall';

export interface Statement {
    readonly values: ReadonlyArray<string | SubtagCall>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
