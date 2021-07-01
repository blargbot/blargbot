import { Cluster } from '../cluster';
import { codeBlock, commandTypes } from '../utils';
import { BaseGlobalCommand } from '../core/command';

type EvalResult<T extends boolean = boolean> = { success: T, result: unknown };
type EvalType = 'master' | 'global' | `cluster${number}`

export class EvalCommand extends BaseGlobalCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'eval',
            category: commandTypes.CAT,
            definition: {
                parameters: '{code+}',
                execute: (ctx) => this.eval(ctx.author.id, ctx.argsString),
                description: 'Runs the code you enter on the current cluster',
                subcommands: {
                    'master': {
                        parameters: '{code+}',
                        execute: (ctx) => this.mastereval(ctx.author.id, ctx.argRange(1, true)),
                        description: 'Runs the code you enter on the master process'
                    },
                    'global': {
                        parameters: '{code+}',
                        execute: (ctx) => this.globaleval(ctx.author.id, ctx.argRange(1, true)),
                        description: 'Runs the code you enter on all the clusters and aggregates the result'
                    },
                    'cluster': {
                        parameters: '{clusterId:number} {code+}',
                        execute: (ctx, [clusterId]) => this.clustereval(clusterId, ctx.author.id, ctx.argRange(2, true)),
                        description: 'Runs the code you enter on all the clusters and aggregates the result'
                    }
                }
            }
        });
    }

    public async eval(userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [, code];

        const { success, result } = await this.cluster.eval(userId, code);
        return success
            ? `Input:${codeBlock(code, 'js')}Output:${codeBlock(result, 'json')}`
            : `An error occured!${codeBlock(result, 'json')}`;
    }

    public async mastereval(userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [, code];

        const { success, result } = await this.requestEval({ type: 'master', userId, code });
        return success
            ? `Master eval input:${codeBlock(code, 'js')}Output:${codeBlock(result, 'json')}`
            : `An error occured!${codeBlock(result, 'json')}`;
    }

    public async globaleval(userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [, code];

        const response = await this.requestEval<Record<number, EvalResult>>({ type: 'global', userId, code });
        if ('success' in response)
            return `An error occured!${codeBlock(response.result, 'json')}`;

        return `Global eval input:${codeBlock(code, 'js')}${Object.keys(response).map(id => {
            const { success, result } = response[id];
            return success
                ? `Cluster ${id} output:${codeBlock(result, 'json')}`
                : `An error occured!${codeBlock(result, 'json')}`;
        }).join('')}`;
    }

    public async clustereval(clusterId: number, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [, code];

        const { success, result } = await this.requestEval({ type: <EvalType>`cluster${clusterId}`, userId, code });
        return success
            ? `Cluster ${clusterId} eval input:${codeBlock(code, 'js')}Output:${codeBlock(result, 'json')}`
            : `An error occured!${codeBlock(result, 'json')}`;
    }

    private async requestEval<T = EvalResult>(data: { type: EvalType, userId: string, code: string }): Promise<T | EvalResult<false>> {
        try {
            return <T>await this.cluster.worker.request('meval', data);
        } catch (err) {
            return { success: false, result: err };
        }
    }
}