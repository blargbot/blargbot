import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class PCCheckGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

        const container: Array<{ italic: boolean, text: string }> = [];
        let italic = false;
        let temp = '';
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '*') {
                container.push({ italic, text: temp });
                temp = '';
                italic = !italic;
            }
            else
                temp += text[i];
        }
        container.push({ italic, text: temp });

        return this.renderPhantom('pccheck.html', {
            scale: 2,
            transformArg: container,
            transform(m: typeof container) {
                const thing = document.getElementById('replace1');
                if (thing) {
                    for (let i = 0; i < m.length; i++) {
                        const el = document.createElement(m[i].italic ? 'em' : 'span');
                        el.innerText = m[i].text;
                        thing.appendChild(el);
                    }
                }
            }
        });
    }
}
