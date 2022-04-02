import { BaseStoredVar } from './BaseStoredVar';

export interface VersionStoredVar extends BaseStoredVar<'version'> {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
}
