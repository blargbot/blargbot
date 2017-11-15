const path = require('path');
const fs = require('fs');

let deleteFile = path.join(__dirname, '..', 'Core', 'Image', 'Resources', 'delete.html');

const phantom = require('phantom');

async function meow() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on("onResourceRequested", function (requestData) {
    console.info('Requesting', requestData.url);
  });

  const status = await page.open(deleteFile);
  console.log(status);

  await page.property('viewportSize', { width: 1440, height: 900 });
  await page.property('zoomFactor', 16);

  let rect = await page.evaluate(function () {
    document.querySelector('#replace1').innerText = 'This was replaced!';
    return document.querySelector('#workspace').getBoundingClientRect();
  });
  console.log(rect);
  await page.property('clipRect', {
    top: rect.top,
    left: rect.left,
    width: rect.width * 16,
    height: rect.height * 16
  });

  await page.invokeMethod('render', path.join(__dirname, 'output.png'));

  await instance.exit();
}

meow();