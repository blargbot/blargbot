import { AnyMessage, GuildMessage } from 'eris';
import { Cluster } from '../Cluster';
import { guard, randInt } from '../core';


export async function handleTableFlip(cluster: Cluster, msg: AnyMessage): Promise<void> {
    if (!guard.isGuildMessage(msg) || msg.author.bot)
        return;

    if (msg.content.includes('(╯°□°）╯︵ ┻━┻'))
        await flipTables(cluster, msg, false);

    if (msg.content.includes('┬─┬﻿ ノ( ゜-゜ノ)'))
        await flipTables(cluster, msg, true);

}


async function flipTables(cluster: Cluster, msg: GuildMessage, unflip: boolean): Promise<void> {
    const tableflip = await cluster.database.guilds.getSetting(msg.channel.guild.id, 'tableflip');
    if (tableflip === true) {
        const seed = randInt(0, 3);
        await cluster.util.send(msg, tables[unflip ? 'unflip' : 'flip'].prod[seed]);
    }
}
const tables = {
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