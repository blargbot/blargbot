import { Message } from 'eris';
import { Cluster } from '../cluster';
import { commandTypes, humanize, snowflake } from '../newbu';
import { BaseDCommand } from '../structures/BaseDCommand';

export class RespawnCommand extends BaseDCommand {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'respawn', {
            category: commandTypes.GENERAL,
            hidden: true,
            usage: 'respawn <id>',
            info: 'Cluster respawning only for staff.'
        });
    }

    public async execute(msg: Message, words: string[]): Promise<void> {
        const police = await this.cluster.rethinkdb.getVar('police');
        if (police?.value.includes(msg.author.id) !== true)
            return;

        const id = parseInt(words[1]);
        if (isNaN(id))
            return void await this.send(msg, 'that wasn\'t even a number pls');

        await this.send(this.config.discord.channels.shardlog, `**${humanize.fullName(msg.author)}** has called for a respawn of cluster ${id}.`);
        this.cluster.worker.send('respawn', snowflake.create(), { id, channel: msg.channel.id });
        await this.send(msg, `ok cluster ${id} is being respawned and stuff now`);
    }
}

module.exports = RespawnCommand;
