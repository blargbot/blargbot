import { BaseGlobalCommand, commandTypes, CommandContext, codeBlock, EvalResult, EvalType } from '../core';

export class EvalCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'eval',
            category: commandTypes.OWNER,
            definitions: [
                {
                    parameters: '{code+}',
                    execute: (ctx) => this.eval(ctx, ctx.author.id, ctx.argsString),
                    description: 'Runs the code you enter on the current cluster'
                },
                {
                    parameters: 'master {~code+}',
                    execute: (ctx, [code]) => this.mastereval(ctx, ctx.author.id, code),
                    description: 'Runs the code you enter on the master process'
                },
                {
                    parameters: 'global {~code+}',
                    execute: (ctx, [code]) => this.globaleval(ctx, ctx.author.id, code),
                    description: 'Runs the code you enter on all the clusters and aggregates the result'
                },
                {
                    parameters: 'cluster {clusterId:number} {~code+}',
                    execute: (ctx, [clusterId, code]) => this.clustereval(ctx, clusterId, ctx.author.id, code),
                    description: 'Runs the code you enter on all the clusters and aggregates the result'
                }
            ]
        });
    }

    public async eval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const { success, result } = await context.cluster.eval(userId, code);
        return success
            ? `Input:${codeBlock(code, 'js')}Output:${codeBlock(result)}`
            : `An error occured!${codeBlock(result)}`;
    }

    public async mastereval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval(context, { type: 'master', userId, code });
        return response.success
            ? `Master eval input:${codeBlock(code, 'js')}Output:${codeBlock(response.result)}`
            : `An error occured!${codeBlock(response.error)}`;
    }

    public async globaleval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval<Record<string, EvalResult>>(context, { type: 'global', userId, code });
        if (!response.success)
            return `An error occured!${codeBlock(response.error)}`;

        return `Global eval input:${codeBlock(code, 'js')}${Object.keys(response).map(id => {
            const clusterResponse = response.result[id];
            return clusterResponse.success
                ? `Cluster ${id} output:${codeBlock(clusterResponse.result)}`
                : `Cluster ${id}: An error occured!${codeBlock(clusterResponse.error)}`;
        }).join('')}`;
    }

    public async clustereval(context: CommandContext, clusterId: number, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval(context, { type: `cluster${clusterId}`, userId, code });
        return response.success
            ? `Cluster ${clusterId} eval input:${codeBlock(code, 'js')}Output:${codeBlock(response.result)}`
            : `An error occured!${codeBlock(response.error)}`;
    }

    private async requestEval<T>(context: CommandContext, data: { type: EvalType; userId: string; code: string; }): Promise<EvalResult<T>> {
        try {
            return await context.cluster.worker.request('meval', data);
        } catch (err: unknown) {
            return { success: false, error: err };
        }
    }
}
