import type { BBTagRuntime, SourceProvider as BBTagSourceProvider } from '@bbtag/blargbot';

export class SourceProvider implements BBTagSourceProvider {
    public get(context: BBTagRuntime, type: 'tag' | 'cc', name: string): Promise<{ content: string; cooldown: number; } | undefined> {
        context;
        type;
        name;
        throw new Error('Method not implemented.');
    }
}
// {
//     get: async (ctx, type, name) => {
//         if (type === 'cc') {
//             const ccommand = await this.database.guilds.getCommand(ctx.guild.id, name);
//             if (ccommand === undefined)
//                 return undefined;

//             if (!('alias' in ccommand))
//                 return ccommand;

//             name = ccommand.alias;
//         }

//         return await this.database.tags.get(name);
//     }
// }
