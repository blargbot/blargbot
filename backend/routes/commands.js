const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('hbs');
const sidebar = require('../sidebar');
//const r = require('../../util/rethink');
var meow = '<p>meow</p>';

hbs.registerHelper('sidebar', function (text, url) {
    return sidebar.render();
});

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


hbs.registerHelper('commands', function (text, url) {
    let toReturn = '';
    let lastType = -10;
    let commands = bu.commands;
    for (let i = 0; i < commands.length; i++) {
        if (commands.type != lastType) {
            toReturn += `<div class='centre'><h2 id='${commands[i].type}'>${commandType[commands[i].type]}</h2></div>`;
        }
        toReturn += "<div class='row'>";
        toReturn += "<div class='col s12 m8 offset-m2 l6 offset-l3'>";
        toReturn += `<div class=\"card blue-grey darken-3\" id='${name}'>`;
        toReturn += "<div class='card-content'>";
        toReturn += `<div class='card-title'>${name}</div>`;
        toReturn += `<p class=\"flow-text\">Usage: <code>${usage}</code></p>`;
        toReturn += `<p class=\"flow-text\">Role Needed: ${commandType.perms[commands[i].type]}</p>`;
        toReturn += commands[i].info;
        toReturn += "</div>";
        toReturn += "</div>";
        toReturn += "</div>";
        toReturn += "</div>";
    }
    return toReturn;
});

router.get('/', (req, res) => {
    res.render('commands');
});

module.exports = router;