export abstract class HtmlPlugin {
    public abstract encode(text: string): string;
    public abstract decode(html: string): string;
}
