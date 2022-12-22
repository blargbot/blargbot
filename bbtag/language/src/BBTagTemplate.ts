import type { BBTagSubtagCall } from './BBTagSubtagCall.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagTemplate {
    readonly statements: ReadonlyArray<string | BBTagSubtagCall>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
