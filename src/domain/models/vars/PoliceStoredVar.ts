import { BaseStoredVar } from './BaseStoredVar';

export interface PoliceStoredVar extends BaseStoredVar<'police'> {
    readonly value: readonly string[];
}
