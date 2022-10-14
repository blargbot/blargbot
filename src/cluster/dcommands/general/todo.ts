import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.todo;

export class ToDoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `todo`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.list.description,
                    execute: ctx => this.viewTodo(ctx)
                },
                {
                    parameters: `remove {itemId:integer}`,
                    description: cmd.remove.description,
                    execute: (ctx, [itemId]) => this.removeItem(ctx, itemId.asInteger)
                },
                {
                    parameters: `add {item+}`,
                    description: cmd.add.description,
                    execute: (ctx, [item]) => this.addItem(ctx, item.asString)
                }
            ]
        });
    }

    public async viewTodo(context: CommandContext): Promise<CommandResult> {
        const todoList = await context.database.users.getTodo(context.author.id) ?? [];
        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description({
                        items: todoList.map((e, i) => ({ id: i, value: e }))
                    })
                }
            ]
        };
    }

    public async addItem(context: CommandContext, item: string): Promise<CommandResult> {
        await context.database.users.addTodo(context.author.id, item);
        return cmd.add.success;
    }

    public async removeItem(context: CommandContext, index: number): Promise<CommandResult> {
        if (!await context.database.users.removeTodo(context.author.id, index - 1))
            return cmd.remove.unknownId({ id: index });
        return cmd.remove.success;
    }
}
