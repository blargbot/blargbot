import { StoredEventOptionsBase } from './StoredEventOptionsBase';

export interface UnmuteEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}
