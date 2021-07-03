export function quote(content: string): string {
    return '\n' + content.split('\n')
        .map(c => `> ${c}`)
        .join('\n') + '\n';
}
