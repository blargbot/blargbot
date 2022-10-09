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
            const reply = await context.queryText({ prompt: `This brainfuck code requires user input. Please say what you want to use:` });
            if (reply.state !== `SUCCESS`)
                return `❌ No input was provided!`;

            input = reply.value;
        }

        try {
            const result = this.#client.execute(code, input);
            const pointers = showPointers ? `\n\n[${result.memory.list.join(`,`)}]\nPointer: ${result.memory.pointer}` : ``;
            return result.output.trim().length === 0
                ? `ℹ️ No output...${pointers}`
                : `✅ Output:\n> ${result.output.trim().split(`\n`).join(`\n> `)}${pointers}`;
        } catch (ex: unknown) {
            context.logger.error(`Running brainfuck failed. Code:`, code, `Input:`, input, ex);
            return `❌ Something went wrong...`;
        }
    }
}
