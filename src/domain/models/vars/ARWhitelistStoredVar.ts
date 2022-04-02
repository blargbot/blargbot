import { BaseStoredVar } from './BaseStoredVar';

export interface ARWhitelistStoredVar extends BaseStoredVar<'arwhitelist'> {
    readonly values: readonly string[];
}
