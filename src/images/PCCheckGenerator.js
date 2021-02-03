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

        return this.renderPhantom('pccheck.html', {
            scale: 2,
            transformArg: container,
            transform(container) {
                // eslint-disable-next-line no-undef
                var thing = document.getElementById('replace1');
                for (var i = 0; i < container.length; i++) {
                    // eslint-disable-next-line no-undef
                    var el = document.createElement(container[i].italic ? 'em' : 'span');
                    el.innerText = container[i].text;
                    thing.appendChild(el);
                }
            }
        });
    }
}
module.exports = { PCCheckGenerator };
