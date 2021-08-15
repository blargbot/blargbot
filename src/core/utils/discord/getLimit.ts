export function getLimit(component: MessageComponent): number {
    switch (component) {
        case 'content': return 2000;
        case 'embed.title': return 256;
        case 'embed.description': return 4096;
        case 'embed.fields': return 25;
        case 'embed.field.name': return 256;
        case 'embed.field.value': return 1024;
        case 'embed.footer.text': return 2048;
        case 'embed.author.name': return 256;
        case 'embeds': return 6000;
    }
}

export type MessageStringComponent =
    | 'content'
    | 'embed.title'
    | 'embed.description'
    | 'embed.field.name'
    | 'embed.field.value'
    | 'embed.footer.text'
    | 'embed.author.name'

export type MessageComponent =
    | MessageStringComponent
    | 'embed.fields'
    | 'embeds'
