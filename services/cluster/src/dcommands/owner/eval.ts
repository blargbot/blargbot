import { inspect } from 'node:util';

import { CommandType } from '@blargbot/cluster/utils/index.js';
import type { EvalResult, GlobalEvalResult, MasterEvalRequest } from '@blargbot/core/types.js';

import type { CommandContext} from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.eval;

export class EvalCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'eval',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{~code+}',
                    description: cmd.here.description,
                    execute: (ctx, [code]) => this.eval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: 'master {~code+}',
                    description: cmd.master.description,
                    execute: (ctx, [code]) => this.mastereval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: 'global {~code+}',
                    description: cmd.global.description,
                    execute: (ctx, [code]) => this.globaleval(ctx, ctx.author.id, code.asString)
                },
                {
                    parameters: 'cluster {clusterId:number} {~code+}',
                    description: cmd.cluster.description,
                    execute: (ctx, [clusterId, code]) => this.clustereval(ctx, clusterId.asNumber, ctx.author.id, code.asString)
                }
            ]
        });
    }

    public async eval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await context.cluster.eval(userId, code);
        return response.success
            ? cmd.here.success({ code, result: inspect(response.result, { depth: 10 }) })
            : cmd.errors.error({ result: response.error });
    }

    public async mastereval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: 'master', userId, code });
        return response.success
            ? cmd.master.success({ code, result: inspect(response.result, { depth: 10 }) })
            : cmd.errors.error({ result: response.error });
    }

    public async globaleval(context: CommandContext, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: 'global', userId, code });
        if (response.success === false)
            return cmd.errors.error({ result: response.error as string });

        return cmd.global.results.template({
            code,
            results: Object.entries(<GlobalEvalResult>response)
                .map(([clusterId, response]) => response.success
                    ? cmd.global.results.success({ clusterId: Number(clusterId), result: inspect(response.result, { depth: 10 }) })
                    : cmd.global.results.failed({ clusterId: Number(clusterId), result: inspect(response.error, { depth: 10 }) }))
        });
    }

    public async clustereval(context: CommandContext, clusterId: number, userId: string, code: string): Promise<CommandResult> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [undefined, code];

        const response = await this.#requestEval(context, { type: `cluster${clusterId}`, userId, code });
        return response.success
            ? cmd.cluster.success({ clusterId, code, result: inspect(response.result, { depth: 10 }) })
            : cmd.errors.error({ result: response.error });
    }

    async #requestEval(context: CommandContext, data: MasterEvalRequest & { type: `cluster${number}` | 'master'; }): Promise<EvalResult>
    async #requestEval(context: CommandContext, data: MasterEvalRequest & { type: 'global'; }): Promise<GlobalEvalResult | Extract<EvalResult, { success: false; }>>
    async #requestEval(context: CommandContext, data: MasterEvalRequest): Promise<GlobalEvalResult | EvalResult> {
        return await context.cluster.worker.request('meval', data);
    }
}
