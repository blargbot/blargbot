import { StoredEventOptionsBase } from './StoredEventOptionsBase';

export interface UnbanEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}
