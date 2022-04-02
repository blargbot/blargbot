import { BaseStoredVar } from './BaseStoredVar';

export interface SupportStoredVar extends BaseStoredVar<'support'> {
    readonly value: readonly string[];
}
