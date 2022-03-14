import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

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
