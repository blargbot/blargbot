import type { SubtagArgument } from './SubtagArgument.js';

export interface SubtagArgumentArray extends ReadonlyArray<SubtagArgument> {
    readonly subtagName: string;
}
