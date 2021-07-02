import { Cluster } from '../Cluster';
import { BaseSubtag, discordUtil, SubtagType } from '../core';

export class EmbedSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'embed',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['embed'],
                    description: 'Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object.\n' +
                        'This subtag works well with `{embedbuild}`. If attempting to use inside of a `{send}`, `{edit}` or `{dm}`, you should not include `{embed}`, ' +
                        'and instead just pass the content direct to `{send}`/`{edit}`/`{dm}`\n' +
                        'You can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) ' +
                        'and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds ' +
                        '[here](https://leovoel.github.io/embed-visualizer/)',
                    exampleCode: '{embed;{lb}"title":"Hello!"{rb}}',
                    exampleOut: '(an embed with "Hello!" as the title)',
                    execute: (ctx, args) => {
                        ctx.state.embed = discordUtil.parseEmbed(args[0].value);
                    }
                }
            ]
        });
    }
}