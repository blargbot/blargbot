import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class PCCheckGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return;

        let container: Array<{ italic: boolean, text: string }> = [];
        let italic = false;
        let temp = '';
        for (var i = 0; i < text.length; i++) {
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
                var thing = document.getElementById('replace1');
                if (thing) {
                    for (var i = 0; i < m.length; i++) {
                        var el = document.createElement(m[i].italic ? 'em' : 'span');
                        el.innerText = m[i].text;
                        thing.appendChild(el);
                    }
                }
            }
        });
    }
}
