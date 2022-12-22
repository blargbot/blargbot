import type { BBTagTemplate } from './BBTagTemplate.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagSubtagCall {
    readonly name: BBTagTemplate;
    readonly args: readonly BBTagTemplate[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
