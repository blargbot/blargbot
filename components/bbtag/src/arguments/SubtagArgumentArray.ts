import { SubtagArgument } from './SubtagArgument';

export interface SubtagArgumentArray extends ReadonlyArray<SubtagArgument> {
    readonly subtagName: string;
}
