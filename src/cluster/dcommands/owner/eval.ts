import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { codeBlock, CommandType } from '@blargbot/cluster/utils';
import { EvalResult, GlobalEvalResult, MasterEvalRequest } from '@blargbot/core/types';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.eval;

export class EvalCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `eval`,
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: `{~code+}`,
                    description: cmd.here.description,
                    execute: (ctx, [code]) => this.eval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: `master {~code+}`,
                    description: cmd.master.description,
                    execute: (ctx, [code]) => this.mastereval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: `global {~code+}`,
                    description: cmd.global.description,
                    execute: (ctx, [code]) => this.globaleval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: `cluster {clusterId:number} {~code+}`,
                    description: cmd.cluster.description,
                    execute: (ctx, [clusterId, code]) => this.clustereval(ctx, clusterId.asNumber, ctx.author.id, code.asString)
                }
            ]
        });
    }

    public async eval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const result = await context.cluster.eval(userId, code);
        return result.success
            ? `✅ Input:${codeBlock(code, `js`)}Output:${codeBlock(result.result)}`
            : `❌ An error occured!${codeBlock(result.error)}`;
    }

    public async mastereval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: `master`, userId, code });
        return response.success
            ? `✅ Master eval input:${codeBlock(code, `js`)}Output:${codeBlock(response.result)}`
            : `❌ An error occured!${codeBlock(response.error)}`;
    }

    public async globaleval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: `global`, userId, code });
        if (response.success === false)
            return `An error occured!${codeBlock(response.error)}`;

        const masterResponse = <GlobalEvalResult>response;

        return `Global eval input:${codeBlock(code, `js`)}${Object.entries(masterResponse).map(([id, response]) => {
            return response.success
                ? `✅ Cluster ${id} output:${codeBlock(response.result)}`
                : `❌ Cluster ${id}: An error occured!${codeBlock(response.error)}`;
        }).join(``)}`;
    }

    public async clustereval(context: CommandContext, clusterId: number, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: `cluster${clusterId}`, userId, code });
        return response.success
            ? `✅ Cluster ${clusterId} eval input:${codeBlock(code, `js`)}Output:${codeBlock(response.result)}`
            : `❌ An error occured!${codeBlock(response.error)}`;
    }

    async #requestEval(context: CommandContext, data: MasterEvalRequest & { type: `cluster${number}` | `master`; }): Promise<EvalResult>
    async #requestEval(context: CommandContext, data: MasterEvalRequest & { type: `global`; }): Promise<GlobalEvalResult | Extract<EvalResult, { success: false; }>>
    async #requestEval(context: CommandContext, data: MasterEvalRequest): Promise<GlobalEvalResult | EvalResult> {
        return await context.cluster.worker.request(`meval`, data);
    }
}
