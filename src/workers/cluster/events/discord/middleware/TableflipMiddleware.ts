import { ClusterUtilities } from '@cluster/ClusterUtilities';
import { guard, randInt } from '@cluster/utils';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class TableflipMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly util: ClusterUtilities) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        const result = next();
        const flipDir = context.content.includes('(╯°□°）╯︵ ┻━┻') ? 'unflip'
            : context.content.includes('┬─┬﻿ ノ( ゜-゜ノ)') ? 'flip'
                : undefined;

        if (flipDir === undefined)
            return await result;

        if (guard.isGuildMessage(context) && await this.util.database.guilds.getSetting(context.channel.guild.id, 'tableflip') === false)
            return await result;

        const seed = randInt(0, 3);
        await this.util.send(context, TableflipMiddleware.tables[flipDir].prod[seed]);
        return await result;
    }

    public static tables = {
        flip: {
            prod: [
                'Whoops! Let me get that for you ┬──┬﻿ ¯\\\\_(ツ)',
                '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
                'Can you not? ヘ(´° □°)ヘ┳━┳',
                'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)',
                '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
                '┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻ Get these tables out of my face!',
                '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
                'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
            ]
        },
        unflip: {
            prod: [
                '┬──┬﻿ ¯\\\\_(ツ) A table unflipped is a table saved!',
                '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
                'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
                'ヘ(´° □°)ヘ┳━┳ Was that so hard?',
                '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
                'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
                'Get back on the ground! (╯ರ ~ ರ）╯︵ ┻━┻',
                'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
            ]
        }
    };
}
