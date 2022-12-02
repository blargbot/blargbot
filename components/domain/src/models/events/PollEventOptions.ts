import { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface PollEventOptions extends StoredEventOptionsBase {
    readonly color: number;
    readonly channel: string;
    readonly guild: string;
    readonly user: string;
    readonly msg: string;
    readonly content: string;
    readonly strict?: readonly string[];
}
