const { ImageGenerator } = require('./ImageGenerator');

class PCCheckGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let container = [];
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

        return await renderPhantom('pccheck.html', {}, 2, undefined, [function (m) {
            var thing = document.getElementById('replace1');
            for (var i = 0; i < m.length; i++) {
                var el = document.createElement(m[i].italic ? 'em' : 'span');
                el.innerText = m[i].text;
                thing.appendChild(el);
            }
        }, getResize(this.logger)], container);
    }
}
module.exports = { PCCheckGenerator };
