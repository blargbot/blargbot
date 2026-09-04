import type { IFormatter } from '../types.js';

export interface ReplacementContext {
    readonly formatter: IFormatter;
    readonly valueStack: readonly ReplacementValue[];
    withValue<T>(value: ReplacementValue, action: (value: this) => T): T;
}

export type ReplacementValue = unknown
