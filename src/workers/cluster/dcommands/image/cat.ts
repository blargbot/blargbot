import { Cluster } from '@cluster';
import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, randInt } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';
import { Handler as Wolken } from 'wolken';

export class CatCommand extends BaseGlobalCommand {
    private readonly client: Wolken;

    public constructor(cluster: Cluster) {
        super({
            name: 'cat',
            category: CommandType.IMAGE,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets a picture of a cat.',
                    execute: () => this.render()
                }
            ]
        });

        this.client = new Wolken(cluster.config.general.wolke, 'Wolke', 'blargbot/6.0.0');
    }

    public async render(): Promise<MessageEmbedOptions> {
        const res = await this.client.getRandom({ type: 'animal_cat', allowNSFW: false });
        return {
            image: { url: res.url },
            footer: { text: 'Powered by weeb.sh' },
            color: randInt(0x1, 0xffffff)
        };
    }
}
