import { PollEventOptions } from './PollEventOptions';
import { RemindEventOptions } from './RemindEventOptions';
import { TagEventOptions } from './TagEventOptions';
import { TimerEventOptions } from './TimerEventOptions';
import { UnbanEventOptions } from './UnbanEventOptions';
import { UnmuteEventOptions } from './UnmuteEventOptions';
import { UnTimeoutEventOptions } from './UntimeoutEventOptions';

export type EventOptionsTypeMap = {
    'tag': TagEventOptions;
    'unmute': UnmuteEventOptions;
    'unban': UnbanEventOptions;
    'untimeout': UnTimeoutEventOptions;
    'timer': TimerEventOptions;
    'remind': RemindEventOptions;
    'poll': PollEventOptions;
};
