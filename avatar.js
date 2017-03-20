var avatars = [];
for (var i = 0; i < 1; i++) {
    avatars.push(getBase64(i));
}

dep.fs.writeFileSync(dep.path.join(__dirname, `avatars2.json`), JSON.stringify(avatars, null, 4));

console.log('done');

function getBase64(iteration) {
    var bitmap = dep.fs.readFileSync(dep.path.join(__dirname, 'img', 'avatars', 'christmas', `blargbot-christmas.png`));

    return 'data:image/png;base64,' + new Buffer(bitmap).toString('base64');
}