import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SleepyCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('sleepy', 'sleepy', 'is sleepy', 'self', 'Let everyone know that you\'re feeling tired.', cluster.config.general.wolke);
    }
}
