import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SleepyCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('sleepy', {
            search: 'sleepy',
            action: 'is sleepy',
            description: 'Let everyone know that you\'re feeling tired.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
