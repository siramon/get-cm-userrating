import fs_ from 'node:fs';

const fs = fs_.promises;
const regex = /((const\ d2\ =\ \[)([^\]]+)(\]))/

const args = process.argv.slice(2);
if (undefined === args[0]) {
  process.exit(1);
}
let player = args[0];

let meanValueDays = 90;
if (undefined !== args[1]) {
  meanValueDays = 1 * args[1];
}

let now = Date.now()

async function prepareJSONStringFromPlayerTmpFile(player) {
  const data = await fs.readFile('./playerinfo/' + player + '.html')

  // find the relevant section in the players source file
  let found = data.toString().match(regex);
  let playerValues = '[' + found[3] +']';
  
  playerValues = playerValues.replace(/x/g, '"x"');
  playerValues = playerValues.replace(/y/g, '"y"');
  playerValues = playerValues.replace(/[\ \r\n]/g, '');
  playerValues = playerValues.replace(/\},]/g, '}]');
  return Promise.resolve(playerValues);
}

function parseJSONPlayerInfo(playerData) {
  playerData = JSON.parse(playerData);

  // sort timestamps, as the JSON stringify operation does not necessarily take the original order
  playerData.sort(function (a, b) {
    return b.x - a.x;
  });

  return playerData;
}

function reduceToMeanProInterval(playerValues, range) {
  let tmpArraySameTimestamp = [];
  let playerRangeValues = [];
  let playerIntervalValues = {};
  
  let lastDate = false;

  for (let i = 0; i < playerValues.length; i+=1) {
    if (i === 0) {
      tmpArraySameTimestamp.push(playerValues[i]);
    } else {
      // start to compare with the last timestamp, as soon as we actually have two timestamps -> i > 0

      if (playerValues[i-1].x === playerValues[i].x) {
        // same timestamp, just add to the temporary arry
        tmpArraySameTimestamp.push(playerValues[i]);
      } else {
        // timestamp changed, finish the tmp array (calculate the mean value),
        if (tmpArraySameTimestamp.length === 1) {
          playerRangeValues.push(tmpArraySameTimestamp[0]);
        } else {
          let sumOfValues = 0;
          let j = 0;
          for (j = 0; j < tmpArraySameTimestamp.length; j+= 1) {
            sumOfValues += tmpArraySameTimestamp[j].y;
          }
          playerRangeValues.push({
            "x": tmpArraySameTimestamp[0].x,
            "y": sumOfValues / tmpArraySameTimestamp.length
          });
        }
        tmpArraySameTimestamp = [];
        tmpArraySameTimestamp.push(playerValues[i]);
        if (playerValues[i].x <= (now - (range * 24 * 3600 * 1000))) {
          if (lastDate === false)  {
            lastDate = true;
          } else {
            i = playerValues.length;
          }
        }
      }
    }
  }
  for (let i = 0, j = 0; i < (range * 24); i+=1) {
    // add up count of values for every hour (!) until end of range
 
    if ((now - i * 1000 * 3600) > playerRangeValues[j].x) {
      if (undefined === playerIntervalValues[playerRangeValues[j].y]) {
        playerIntervalValues[playerRangeValues[j].y] = 0;
      }
      playerIntervalValues[playerRangeValues[j].y]++;
    } else {
      j++;
      if (undefined === playerIntervalValues[playerRangeValues[j].y]) {
        playerIntervalValues[playerRangeValues[j].y] = 0;
      }
      playerIntervalValues[playerRangeValues[j].y]++;
    }
  }
  return playerIntervalValues;
}

function calculateMeanValueForRange(playerIntervalValues, range) {
  let playerSum = 0;
  let rangeAddup = 0;

  for (let obj in playerIntervalValues) {
    rangeAddup += (playerIntervalValues[obj] * 1);
    playerSum += obj * playerIntervalValues[obj];
  }
  if (rangeAddup == (range * 24)) {
    return (playerSum / rangeAddup);
  } else {
    throw("Player has not played for " + range + " days!");
  }
  
}

async function main(player, days) {
  if (undefined !== days) {
    meanValueDays = days;
  }
  await prepareJSONStringFromPlayerTmpFile(player)
  .then ( data => {
    let playerMeanValue = undefined;
    now = Date.now(); // updating the timestamp as soon as the playerfile is read

    data = parseJSONPlayerInfo(data);
    data = reduceToMeanProInterval(data, meanValueDays)
    console.log(player + " [" + meanValueDays + " day(s)]: " + calculateMeanValueForRange(data, meanValueDays));
  })
  .catch ( (e) => {
    console.log("foo" + e);
  })
}

export { main };
