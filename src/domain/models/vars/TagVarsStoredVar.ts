import { BaseStoredVar } from './BaseStoredVar';

export interface TagVarsStoredVar extends BaseStoredVar<'tagVars'> {
    readonly values: { readonly [key: string]: unknown; } | undefined;
}
