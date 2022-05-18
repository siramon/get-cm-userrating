import {promisify} from 'node:util';
import stream from 'node:stream';
import fs from 'node:fs';
import got from 'got';
import {CookieJar} from 'tough-cookie';
import {main as calculateMeanValue} from './player-extract-data.js';

const args = process.argv.slice(2);
if (undefined === args[0]) {
  process.exit(1);
}
const cmUser = args[0];
//let cmCookie = '22ea';
//let cmCookie = 'c5a6';
//let cmCookie = 'c1d6';

let meanDays = 90;
if (undefined !== args[1]) {
  meanDays = 1 * args[1];
}

const cmSite = 'https://www.chessmail.de/';


const cmPath = cmSite + '~' + cmUser;
const path = './playerinfo/' + cmUser + '.html';

async function getCMInitialRequest() {
  let response = await got(cmSite);
  if (response.statusCode === 200) {
    return response.body;
  } else {
    throw new Error(response.error || 'Oops. Something went wrong! Try again please.');
  }
}

async function getCMCookieInfo(firstReqBody) {
  const regex = /document\.cookie\ =\ "tk=([^"]+)"/;
  const cookieJar = new CookieJar();
  let found = firstReqBody.match(regex);
  if (undefined !== found && found.length === 2) {
    const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
    await setCookie('tk=' + found[1], cmSite);
    return Promise.resolve(cookieJar);
  } else {
    throw new Error('Cookie information not found');
  }
} 

async function savePlayerToFile(player, cookieJar) {
  const pipeline = promisify(stream.pipeline);  
  await pipeline(
    got.stream(cmPath, {
      cookieJar
    }),
    fs.createWriteStream(path)
  );
  return Promise.resolve(player)
}

async function main() {
  await getCMInitialRequest()
  .then( res  => {
    return getCMCookieInfo(res);
  })
  .then( (cookieJar) => {
    return savePlayerToFile(cmUser, cookieJar);
  })
  .then (player => {
    calculateMeanValue(player, meanDays);
  })
  .catch ( (e) => {
    console.log("Fehler: " + e);
  })
}

main();
