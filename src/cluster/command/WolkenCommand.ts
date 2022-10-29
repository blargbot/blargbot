import { CommandType } from '@blargbot/cluster/utils';
import { IFormatStringDefinition, IFormattable, util } from '@blargbot/formatting';
import { User } from 'eris';
import Wolken from 'wolken';

import { CommandResult } from '../types';
import { CommandContext } from './CommandContext';
import { GlobalCommand } from './GlobalCommand';

export type WolkeOptions = WolkeSelfOptions | WolkeUserOptions;

export interface WolkeOptionsBase {
    search: string;
    description: IFormattable<string>;
    wolkeKey: string;
}

export interface WolkeSelfOptions extends WolkeOptionsBase {
    action?: IFormatStringDefinition<{ self: User; }>;
    user?: false;
}
export interface WolkeUserOptions extends WolkeOptionsBase {
    action: IFormatStringDefinition<{ self: User; target?: User; }>;
    user: true;
}

export abstract class WolkenCommand extends GlobalCommand {
    readonly #client: Wolken;

    public constructor(
        name: string,
        options: WolkeOptions
    ) {
        super({
            name: name,
            category: CommandType.SOCIAL,
            definitions: [
                options.user !== true ? {
                    parameters: '',
                    description: options.description,
                    execute: (ctx) => this.render(ctx, options.search, options.action, undefined)
                } : {
                    parameters: '{user:user+?}',
                    description: options.description,
                    execute: (ctx, [user]) => this.render(ctx, options.search, options.action, user.asOptionalUser ?? ctx.author)
                }
            ]
        });

        this.#client = new Wolken(options.wolkeKey, 'Wolke', 'blargbot/6.0.0');
    }

    public async render(context: CommandContext, type: string, action: WolkeOptions['action'], target: User | undefined): Promise<CommandResult> {
        const image = await this.#client.getRandom({ type, allowNSFW: false, filetype: 'gif' });
        const self = context.author;
        return {
            embeds: [
                {
                    description: action?.({ self, target }),
                    image: { url: image.url },
                    footer: { text: util.literal('Powered by weeb.sh') }
                }
            ]
        };
    }
}
