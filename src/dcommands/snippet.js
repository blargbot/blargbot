const BaseCommand = require('../structures/BaseCommand');

let id;
const queue = '419235660088606739';
const snippetChannel = '387709753758842883';
const commandChannel = '414754839059365908';

class SnippetCommand extends BaseCommand {
    constructor() {
        super({
            name: 'snippet',
            category: bu.CommandType.GENERAL,
            usage: 'snippet <submit <code> <flags> | approve <id> | reject <id> <reason>>',
            info: 'submit a snippet and stuff',
            onlyOn: '194232473931087872',
            flags: [{ flag: 't', word: 'title', desc: 'The title of the snippet' },
            {
                flag: 'd',
                word: 'description',
                desc: 'The description of the snippet'
            },
            {
                flag: 'c',
                word: 'command',
                desc: 'Use this to designate it as a command instead of a snippet'
            }]
        });
    }

    async execute(msg, words, text) {
        if (msg.guild.id !== '194232473931087872') return;
        if (!id) {
            let idVal = (await r.table('vars').get('snippetid'));
            if (!idVal) {
                id = 1
                await r.table('vars').insert({ varname: 'snippetid', value: id });
            } else {
                id = idVal.value;
            }
        }

        let isStaff = msg.member.roles.includes('280159905825161216') || msg.member.roles.includes('263066486636019712');
        switch ((words[1] || '').toLowerCase()) {
            case 'submit': {
                let eee = text.replace(/^.*?snippet\s+/i, '');
                console.log(eee);
                let input = bu.parseInput(this.flags, eee, true);
                console.verbose(input);
                if (!input.t)
                    return await bu.send(msg, 'You must include a title.');
                if (!input.d)
                    return await bu.send(msg, 'You must include a description.');

                let title = input.t.join(' ');
                let desc = input.d.join(' ');
                let snippet = !input.c;

                let content = input.undefined.slice(1).join(' ');
                content = content.replace(/```/g, '`\u200b`\u200b`\u200b');

                let msg2 = await bu.send(queue, `**${snippet ? '✂ Snippet' : '💻 Command'} \`${id}\`**
**Title**: ${title}
**Author**: <@${msg.author.id}>
**Description**:

${desc}

\`\`\`cs
${content}
\`\`\``);
                await r.table('snippet').insert({ id: id++, title, desc, content, snippet, author: msg.author.id, channel: msg.channel.id, msgid: msg2.id });
                await r.table('vars').get('snippetid').update({ value: id });
                return await bu.send(msg, `Your snippet has been submitted with an ID of \`${id - 1}\`. Thank you!`);

                break;
            }
            case 'approve': {
                if (!isStaff) return await bu.send(msg, 'Sorry, only staff may approve snippets.');

                let snippet = await r.table('snippet').get(parseInt(words[2]));
                if (!snippet) return await bu.send(msg, 'There is no snippet with that ID.');
                if (snippet.status === 'approved') return await bu.send(msg, `That snippet has already been ${snippet.status}!`);

                let content = `**${snippet.title}** - <@${snippet.author}>

${snippet.desc}

\`\`\`cs
${snippet.content}
\`\`\`
`;
                let msg3 = await bu.send(snippet.snippet ? snippetChannel : commandChannel, content);
                await msg3.addReaction(snippet.snippet ? '👍' : ':calp:298905944224563201')

                let msg2 = await bot.getMessage(queue, snippet.msgid);
                content = msg2.content.split('\n');
                content[0] = `✅ **Approved** \`${snippet.id}\``;
                await r.table('snippet').get(snippet.id).update({ status: 'approved' });
                await msg2.edit(content.join('\n'));
                return await bu.send(msg, 'Snippet has been approved! 👌');
                break;
            }
            case 'reject': {
                if (!isStaff) return await bu.send(msg, 'Sorry, only staff may reject snippets.');
                if (!words[3]) return await bu.send(msg, 'You must specify a rejection reason.');
                let snippet = await r.table('snippet').get(parseInt(words[2]));
                if (!snippet) return await bu.send(msg, 'There is no snippet with that ID.');
                if (snippet.status) return await bu.send(msg, `That snippet has already been ${snippet.status}!`)
                let reason = words.slice(3).join(' ');
                let msg2 = await bot.getMessage(queue, snippet.msgid);
                let content = msg2.content.split('\n');
                content[0] = `❌ **Rejected** \`${snippet.id}\``;
                await r.table('snippet').get(snippet.id).update({ status: 'rejected' });
                await msg2.edit(content.join('\n'));
                await bu.send(snippet.channel, `Hey <@${snippet.author}>, snippet \`${snippet.id}\` got rejected by **${bu.getFullName(msg.author)}** for the following reason:\n\n${reason}`)
                return await bu.send(msg, 'Snippet has been rejected! 👌');
                break;
            }
            default:
                return await bu.send(msg, 'Invalid choice! Do either `submit`, `approve`, or `reject`.');
                break;
        }
    }
}

module.exports = SnippetCommand;
