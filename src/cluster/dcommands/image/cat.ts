import { Cluster } from '@blargbot/cluster';
import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randInt } from '@blargbot/cluster/utils';
import { literal } from '@blargbot/domain/messages/types';
import { Handler as Wolken } from 'wolken';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.cat;

export class CatCommand extends GlobalCommand {
    readonly #client: Wolken;

    public constructor(cluster: Cluster) {
        super({
            name: 'cat',
            category: CommandType.IMAGE,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: () => this.render()
                }
            ]
        });

        this.#client = new Wolken(cluster.config.general.wolke, 'Wolke', 'blargbot/6.0.0');
    }

    public async render(): Promise<CommandResult> {
        const res = await this.#client.getRandom({ type: 'animal_cat', allowNSFW: false });
        return {
            embeds: [
                {
                    image: { url: res.url },
                    footer: { text: literal('Powered by weeb.sh') },
                    color: randInt(0x1, 0xffffff)
                }
            ]
        };
    }
}
