import type { BBTagSubtag } from './BBTagSubtag.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagExpression {
    readonly values: ReadonlyArray<string | BBTagSubtag>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
type IType = BBTagExpression;
// eslint-disable-next-line @typescript-eslint/naming-convention, no-useless-assignment
export const BBTagExpression = class BBTagExpression implements IType {
    readonly #source: string;
    public readonly values: ReadonlyArray<string | BBTagSubtag>;
    public readonly start: SourceMarker;
    public readonly end: SourceMarker;
    public get source(): string {
        return this.#source.slice(this.start.index, this.end.index);
    }

    public constructor(
        values: ReadonlyArray<string | BBTagSubtag>,
        start: SourceMarker,
        end: SourceMarker,
        source: string
    ) {
        this.values = values;
        this.start = start;
        this.end = end;
        this.#source = source;
    }

    public toString(): string {
        return this.source;
    }
};
