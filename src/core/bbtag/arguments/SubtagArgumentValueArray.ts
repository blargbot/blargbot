import { SubtagArgumentValue } from './SubtagArgumentValue';

export interface SubtagArgumentValueArray extends ReadonlyArray<SubtagArgumentValue> {
    readonly subtagName: string;
}