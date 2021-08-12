import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import Brainfuck from 'brainfuck-node';

export class BrainfuckCommand extends BaseGlobalCommand {
    private readonly client: Brainfuck;

    public constructor() {
        super({
            name: 'brainfuck',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{code+}',
                    description: 'Executes brainfuck code.',
                    execute: (ctx, [code]) => this.eval(ctx, code, false)
                },
                {
                    parameters: 'debug {code+}',
                    description: 'Executes brainfuck code and returns the pointers.',
                    execute: (ctx, [code]) => this.eval(ctx, code, true)
                }
            ]
        });

        this.client = new Brainfuck();
    }

    public async eval(context: CommandContext, code: string, showPointers: boolean): Promise<string> {
        let input = '';
        if (code.includes(',')) {
            const reply = await context.util.awaitQuery(
                context.channel,
                context.author,
                'This brainfuck code requires user input. Please say what you want to use:'
            );
            input = reply?.content ?? '';
        }

        try {
            const result = this.client.execute(code, input);
            const pointers = showPointers ? `\n\n[${result.memory.list.join(',')}]\nPointer: ${result.memory.pointer}` : '';
            return result.output.trim().length === 0
                ? this.info(`No output...${pointers}`)
                : this.success(`Output:\n> ${result.output.trim().split('\n').join('\n> ')}${pointers}`);
        } catch (ex: unknown) {
            context.logger.error('Running brainfuck failed. Code:', code, 'Input:', input, ex);
            return this.error('Something went wrong...');
        }
    }
}
