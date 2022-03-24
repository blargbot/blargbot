import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { codeBlock, CommandType } from '@blargbot/cluster/utils';
import { EvalResult, GlobalEvalResult, MasterEvalRequest } from '@blargbot/core/types';

export class EvalCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'eval',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{~code+}',
                    execute: (ctx, [code]) => this.eval(ctx, ctx.author.id, code.asString),
                    description: 'Runs the code you enter on the current cluster'
                },
                {
                    parameters: 'master {~code+}',
                    execute: (ctx, [code]) => this.mastereval(ctx, ctx.author.id, code.asString),
                    description: 'Runs the code you enter on the master process'
                },
                {
                    parameters: 'global {~code+}',
                    execute: (ctx, [code]) => this.globaleval(ctx, ctx.author.id, code.asString),
                    description: 'Runs the code you enter on all the clusters and aggregates the result'
                },
                {
                    parameters: 'cluster {clusterId:number} {~code+}',
                    execute: (ctx, [clusterId, code]) => this.clustereval(ctx, clusterId.asNumber, ctx.author.id, code.asString),
                    description: 'Runs the code you enter on all the clusters and aggregates the result'
                }
            ]
        });
    }

    public async eval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const result = await context.cluster.eval(userId, code);
        return result.success
            ? this.success(`Input:${codeBlock(code, 'js')}Output:${codeBlock(result.result)}`)
            : this.error(`An error occured!${codeBlock(result.error)}`);
    }

    public async mastereval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval(context, { type: 'master', userId, code });
        return response.success
            ? this.success(`Master eval input:${codeBlock(code, 'js')}Output:${codeBlock(response.result)}`)
            : this.error(`An error occured!${codeBlock(response.error)}`);
    }

    public async globaleval(context: CommandContext, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval(context, { type: 'global', userId, code });
        if (response.success === false)
            return `An error occured!${codeBlock(response.error)}`;

        const masterResponse = <GlobalEvalResult>response;

        return `Global eval input:${codeBlock(code, 'js')}${Object.entries(masterResponse).map(([id, response]) => {
            return response.success
                ? this.success(`Cluster ${id} output:${codeBlock(response.result)}`)
                : this.error(`Cluster ${id}: An error occured!${codeBlock(response.error)}`);
        }).join('')}`;
    }

    public async clustereval(context: CommandContext, clusterId: number, userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.requestEval(context, { type: `cluster${clusterId}`, userId, code });
        return response.success
            ? this.success(`Cluster ${clusterId} eval input:${codeBlock(code, 'js')}Output:${codeBlock(response.result)}`)
            : this.error(`An error occured!${codeBlock(response.error)}`);
    }

    private async requestEval(context: CommandContext, data: MasterEvalRequest & { type: `cluster${number}` | 'master'; }): Promise<EvalResult>
    private async requestEval(context: CommandContext, data: MasterEvalRequest & { type: 'global'; }): Promise<GlobalEvalResult | Extract<EvalResult, { success: false; }>>
    private async requestEval(context: CommandContext, data: MasterEvalRequest): Promise<GlobalEvalResult | EvalResult> {
        return await context.cluster.worker.request('meval', data);
    }
}
