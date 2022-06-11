import { StoredEventOptionsBase } from './StoredEventOptionsBase';

export interface UnTimeoutEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}
