import { BaseStoredVar } from './BaseStoredVar';

export interface RestartStoredVar extends BaseStoredVar<'restart'> {
    readonly varvalue: {
        readonly channel: string;
        readonly time: number;
    };
}
