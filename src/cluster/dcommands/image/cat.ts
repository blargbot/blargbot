import { Cluster } from '@blargbot/cluster';
import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randInt } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';
import { Handler as Wolken } from 'wolken';

export class CatCommand extends GlobalCommand {
    readonly #client: Wolken;

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

        this.#client = new Wolken(cluster.config.general.wolke, 'Wolke', 'blargbot/6.0.0');
    }

    public async render(): Promise<EmbedOptions> {
        const res = await this.#client.getRandom({ type: 'animal_cat', allowNSFW: false });
        return {
            image: { url: res.url },
            footer: { text: 'Powered by weeb.sh' },
            color: randInt(0x1, 0xffffff)
        };
    }
}
