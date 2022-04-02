import { BaseStoredVar } from './BaseStoredVar';

export interface PGStoredVar extends BaseStoredVar<'pg'> {
    readonly value: number;
}
