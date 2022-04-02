import { StoredEventOptionsBase } from './StoredEventOptionsBase';

export interface TimerEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
}
