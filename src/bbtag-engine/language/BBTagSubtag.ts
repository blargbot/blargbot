import type { BBTagExpression } from './BBTagExpression.js';
import type { SourceMarker } from './SourceMarker.js';

export interface BBTagSubtag {
    readonly name: BBTagExpression;
    readonly args: readonly BBTagExpression[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}
type IType = BBTagSubtag;

// eslint-disable-next-line @typescript-eslint/naming-convention, no-useless-assignment
export const BBTagSubtag = class BBTagSubtag implements IType {
    readonly #source: string;
    public readonly name: BBTagExpression;
    public readonly args: readonly BBTagExpression[];
    public readonly start: SourceMarker;
    public readonly end: SourceMarker;
    public get source(): string {
        return this.#source.slice(this.start.index, this.end.index);
    }

    public constructor(
        name: BBTagExpression,
        args: readonly BBTagExpression[],
        start: SourceMarker,
        end: SourceMarker,
        source: string
    ) {
        this.name = name;
        this.args = args;
        this.start = start;
        this.end = end;
        this.#source = source;
        Object.freeze(this);
    }

    public toString(): string {
        return this.source;
    }
};
