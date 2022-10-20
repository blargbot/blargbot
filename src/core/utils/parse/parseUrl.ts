export function parseUrl(url: string): string {
    if (url.startsWith('<') && url.endsWith('>'))
        url = url.substring(1, url.length - 1);
    return url;
}
