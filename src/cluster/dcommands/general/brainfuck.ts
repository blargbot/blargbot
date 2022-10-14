import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import Brainfuck from 'brainfuck-node';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.brainfuck;

export class BrainfuckCommand extends GlobalCommand {
    readonly #client: Brainfuck;

    public constructor() {
        super({
            name: `brainfuck`,
            aliases: [`bf`],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{code+}`,
                    description: cmd.default.description,
                    execute: (ctx, [code]) => this.eval(ctx, code.asString, false)
                },
                {
                    parameters: `debug {code+}`,
                    description: cmd.debug.description,
                    execute: (ctx, [code]) => this.eval(ctx, code.asString, true)
                }
            ]
        });

        this.#client = new Brainfuck();
    }

    public async eval(context: CommandContext, code: string, showPointers: boolean): Promise<CommandResult> {
        let input = ``;
        if (code.includes(`,`)) {
            const reply = await context.queryText({ prompt: cmd.common.queryInput.prompt });
            if (reply.state !== `SUCCESS`)
                return cmd.common.noInput;

            input = reply.value;
        }

        try {
            const result = this.#client.execute(code, input);
            const output = result.output.trim();
            const state = showPointers ? { memory: result.memory.list, pointer: result.memory.pointer } : undefined;
            return output.length === 0
                ? cmd.common.success.empty({ state })
                : cmd.common.success.default({ output, state });
        } catch (ex: unknown) {
            context.logger.error(`Running brainfuck failed. Code:`, code, `Input:`, input, ex);
            return cmd.common.unexpectedError;
        }
    }
}
