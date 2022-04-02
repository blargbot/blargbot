import { StoredVar } from './StoredVar';

export type GetStoredVar<T extends StoredVar['varname']> = Omit<Extract<StoredVar, { varname: T; }>, 'varname'>;
