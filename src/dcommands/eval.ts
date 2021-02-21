import { Cluster } from '../cluster';
import { codeBlock, commandTypes } from '../utils';
import { BaseCommand } from '../core/command';

export class EvalCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'eval',
            category: commandTypes.CAT,
            handler: {
                parameters: '{code+}',
                execute: (msg, _, __, code) => this.eval(msg.author.id, code),
                description: 'Runs the code you enter on the current cluster'
            }
        });
    }

    public async eval(userId: string, code: string): Promise<string> {
        if (code.startsWith(this.name))
            code = code.substring(this.name.length);
        if (code.startsWith('```') && code.endsWith('```'))
            [code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [code];

        const { success, result } = await this.cluster.eval(userId, code);
        return success
            ? `Input:${codeBlock(code, 'js')}Output:${codeBlock(result)}`
            : `An error occured!${codeBlock(result)}`;
    }
}