// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
    if (typeof exports == 'object' && typeof module == 'object') // CommonJS
        mod(require('../../lib/codemirror'));
    else if (typeof define == 'function' && define.amd) // AMD
        define(['../../lib/codemirror'], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {




    CodeMirror.registerHelper('hint', 'cattag', function (cm, options) {
        var words = options.words;
        var cur = cm.getCursor(), token = cm.getTokenAt(cur);
        var to = CodeMirror.Pos(cur.line, token.end);
        if (token.string && /\w/.test(token.string[token.string.length - 1])) {
            var term = token.string, from = CodeMirror.Pos(cur.line, token.start);
        } else {
            var term = '', from = to;
        }
        var found = [];
        for (var i = 0; i < words.length; i++) {
            var word = words[i].text;
            if (word.slice(0, term.length) == term)
                found.push(words[i]);
        }

        if (found.length) return { list: found, from: from, to: to };
    });
});