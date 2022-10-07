import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';

export class ToDoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `todo`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Shows you your todo list`,
                    execute: ctx => this.viewTodo(ctx)
                },
                {
                    parameters: `remove {itemId:integer}`,
                    description: `Removes an item from your todo list by id`,
                    execute: (ctx, [itemId]) => this.removeItem(ctx, itemId.asInteger)
                },
                {
                    parameters: `add {item+}`,
                    description: `Adds an item to your todo list`,
                    execute: (ctx, [item]) => this.addItem(ctx, item.asString)
                }
            ]
        });
    }

    public async viewTodo(context: CommandContext): Promise<EmbedOptions> {
        const todolist = await context.database.users.getTodo(context.author.id);
        return {
            author: context.util.embedifyAuthor(context.author),
            title: `Todo list`,
            description: todolist === undefined || todolist.length === 0 ? `You have nothing on your list!` : todolist
                .map((e, i) => `**${i + 1}.** ${e}`)
                .join(`\n`)
        };
    }

    public async addItem(context: CommandContext, item: string): Promise<string> {
        await context.database.users.addTodo(context.author.id, item);
        return `✅ Done!`;
    }

    public async removeItem(context: CommandContext, index: number): Promise<string> {
        if (!await context.database.users.removeTodo(context.author.id, index - 1))
            return `❌ Your todo list doesnt have an item ${index}!`;
        return `✅ Done!`;
    }
}
