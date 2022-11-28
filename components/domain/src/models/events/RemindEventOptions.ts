import { StoredEventOptionsBase } from './StoredEventOptionsBase';

export interface RemindEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
    readonly content: string;
}
