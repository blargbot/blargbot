import { Message } from 'eris';
import { Cluster } from '../cluster';
import { codeBlock, commandTypes } from '../newbu';
import { BaseDCommand } from '../structures/BaseDCommand';

export class EvalCommand extends BaseDCommand {
    public constructor(cluster: Cluster) {
        super(cluster, 'eval', {
            category: commandTypes.CAT
        });
    }

    public async execute(msg: Message, _: never, text: string): Promise<void> {
        if (text.startsWith(this.name))
            text = text.substring(this.name.length);
        if (text.startsWith('```') && text.endsWith('```'))
            [text] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(text) ?? [text];

        const { success, result } = await this.cluster.eval(msg.author.id, text);
        const response = success
            ? `Input:${codeBlock(text, 'js')}Output:${codeBlock(result)}`
            : `An error occured!${codeBlock(result)}`;
        await this.util.send(msg, response);
    }
}