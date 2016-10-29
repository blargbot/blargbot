let e = module.exports = {};
const hbs = require('hbs');
const path = require('path');

const commandType = {
    1: "General Commands",
    2: "PRIVATE ERROR",
    3: "NSFW Commands",
    4: "MUSIC ERROR",
    5: "Bot Commander Commands",
    6: "Admin Commands",
    perms: {
        1: 'None',
        2: 'None',
        3: 'None',
        4: 'None',
        5: 'Bot Commander',
        6: 'Admin'
    }
};
const tagType = {
    1: "Simple Tags",
    2: "Complex Tags"
};

e.init = () => {
    hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
    hbs.registerHelper('listcommands', function () {
        let sidebar = '';
        let commands = bu.commands;
        let lastType = -10;
        let keys = Object.keys(commands);
        keys.sort((a, b) => {
            return ((commands[a].category - commands[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            if (commands[keys[i]].category != 2 && commands[keys[i]].category != 4) {
                if (commands[keys[i]].category != lastType) {
                    sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/commands/#${commands[keys[i]].category}'>${commandType[commands[keys[i]].category]}</a></li>`;
                    lastType = commands[keys[i]].category;
                }
                sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/commands/#${keys[i]}'>${keys[i]}</a></li>`;
            }
        }
        return sidebar;
    });

    hbs.registerHelper('listtags', function () {
        let sidebar = '';
        let lastType = -10;
        let tags = bu.tags;
        keys = Object.keys(tags);
        keys.sort((a, b) => {
            return ((tags[a].category - tags[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (tags[key].category != lastType) {
                sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/tags/#${tags[key].category}'>${tagType[tags[key].category]}</a></li>`;
                lastType = tags[key].category;
            }
            sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/tags/#${key}'>${key}</a></li>`;
        }
        return sidebar;
    });

    hbs.registerHelper('tags', function (text, url) {
        let toReturn = '';
        let lastType = -10;
        let tags = bu.tags;
        let keys = Object.keys(tags);
        keys.sort((a, b) => {
            return ((tags[a].category - tags[b].category) * 1000) + (a > b ? 1 : -1);
        });
       // logger.debug(tags);
        for (let i = 0; i < keys.length; i++) {
            if (tags[keys[i]].category != lastType) {
                lastType = tags[keys[i]].category;
                if (lastType == 1) {
                    toReturn += `
                <div class="row">
                <div class=\"centre\" id=\"simple\">
        <h2 id='${lastType}' class='white-text'>${tagType[lastType]}</h2>
    </div>
        <div class="col s10 offset-s1 m10 offset-m1 l10 offset-l1">
            <p class="centre">These tags are just simple replaces, and don't take any arguments.</p>
        </div>
    </div><div class="row">
        <div class="col s12 m10 offset-m1 l10 offset-l1">
            <div class="card blue-grey darken-2">
                <div class="card-content">
                    <table class="responsive-table bordered">
                        <thead>
                        <tr>
                            <th>Tag Name</th>
                            <th>Function</th>
                            <th>Example Tag</th>
                            <th>Example Output</th>
                        </tr>
                        </thead>
                        <tbody>`;
                } else {
                    toReturn += `</tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
    <div class=\"centre\" id=\"simple\">
        <h2 id='${lastType}' class='white-text'>${tagType[lastType]}</h2>
    </div>
        <div class="col s10 offset-s1 m8 offset-m2 l6 offset-l3">
            <p class="centre">These tags are more powerful.<br>
                &lt;&gt; - denotes required arguments<br>
                [] - denotes optional arguments<br>
                ... - denotes one or more arguments </p>
        </div>
    </div><div class="row">
        <div class="col s12 m10 offset-m1 l10 offset-l1">
            <div class="card blue-grey darken-2">
                <div class="card-content">

                    <table class="responsive-table bordered">
                        <thead>

                        <tr>
                            <th>Tag Name</th>
                            <th>Arguments</th>
                            <th>Function</th>
                            <th>Example Tag</th>
                            <th>Example Output</th>
                        </tr>
                        </thead>
                        <tbody>`;
                }
            }
            toReturn += `<tr id='${keys[i]}'>`;
            toReturn += `<td>${keys[i]}</td>`;
            if (lastType != 1) {
                toReturn += `<td>${tags[keys[i]].args}</td>`;
            }
            toReturn += `<td>${tags[keys[i]].desc}</td>`;
            toReturn += `<td>${tags[keys[i]].exampleIn}</td>`;
            toReturn += `<td>${tags[keys[i]].exampleOut}</td>`;
            toReturn += "</tr>";
        }
        toReturn += `</tbody>
                    </table>

                </div>
            </div>
        </div>
    </div`;
        return toReturn;
    });

    hbs.registerHelper('tagseditor', (text, url) => {
        let tags = Object.keys(bu.tags).map(m => {
            return {
                text: m,
                displayText: bu.tags[m].usage
            };
        });
        tags.push('dummy');
        return JSON.stringify(tags);
    });




    hbs.registerHelper('commands', function (text, url) {
        let toReturn = '';
        let lastType = -10;
        let commands = bu.commands;
        let keys = Object.keys(commands);
        keys.sort((a, b) => {
            return ((commands[a].category - commands[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            if (commands[keys[i]].category != 2 && commands[keys[i]].category != 4) {
                if (commands[keys[i]].category != lastType) {
                    toReturn += `<div class='centre white-text'><h2 id='${commands[keys[i]].category}' class='white-text'>${commandType[commands[keys[i]].category]}</h2></div>`;
                    lastType = commands[keys[i]].category;
                }
                toReturn += "<div class='row'>";
                toReturn += "<div class='col s12 m10 offset-m1 l10 offset-l1'>";
                toReturn += `<div class=\"card blue-grey darken-3\" id='${keys[i]}'>`;
                toReturn += "<div class='card-content'>";
                toReturn += `<span class='card-title'>${keys[i]}</span>`;
                toReturn += `<p>Usage: <pre style="margin: 0" class="wrap"><code>${commands[keys[i]].usage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></p>`;
                toReturn += `<p>Role Needed: ${commandType.perms[commands[keys[i]].category]}</p>`;
                toReturn += commands[keys[i]].longinfo;
                toReturn += "</div>";
                toReturn += "</div>";
                toReturn += "</div>";
                toReturn += "</div>";
            }
        }
        return toReturn;
    });
};