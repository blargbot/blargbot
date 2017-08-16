const Generator = require.main.require('./ImageGenerator');

class TheSearchGenerator extends Generator {
    async generate(args) {
        await super.generate(args);

        let base64 = await this.renderPhantom('thesearch.html', { replace1: args.text }, 1, 'PNG', this.resize);

        await this.send('thesearch.png', base64);
    }

    get resize() {
        return function () {
            var el, elements, _i, _len, _results;
            elements = document.getElementsByClassName('resize');
            if (elements.length < 0) {
                return;
            }
            _results = [];
            for (_i = 0, _len = elements.length; _i < _len; _i++) {
                el = elements[_i];
                _results.push((function (el) {
                    var resizeText, _results1;
                    if (el.style['font-size'] === '') el.style['font-size'] = '25px';
                    resizeText = function () {
                        var elNewFontSize;
                        elNewFontSize = (parseInt(el.style.fontSize.slice(0, -2)) - 1) + 'px';
                        el.style.fontSize = elNewFontSize;
                        return el;
                    };
                    _results1 = null;
                    var ii = 0;
                    while (el.scrollHeight > el.parentElement.clientHeight - 20) {
                        _results1 = resizeText();
                        if (++ii == 1000) break;
                    }
                    return _results1;
                })(el));
            }
            return _results;
        };
    }
}

module.exports = TheSearchGenerator;