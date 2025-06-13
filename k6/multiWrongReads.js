import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Gauge } from "k6/metrics";
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import exec from 'k6/execution';
import { SharedArray } from "k6/data";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const data = new SharedArray("1M records", function() { return JSON.parse(open('../data/1MRecords.json')); });

let trendHDB = new Trend("trendHDB", true);
let trendCacheMiss = new Trend("trendCacheMiss", true);

const shardCounter = new Counter('shardCounter', {});

const DOMAIN = "https://shard-nado-us-lax{SN}.harperdbcloud.com";
const BASIC_AUTH = __ENV.BASIC_AUTH ? __ENV.BASIC_AUTH : "Basic SERCX0FETUlOOjE0MDA=";
const HTTP_PORT = __ENV.HTTP_PORT ? __ENV.HTTP_PORT : 9926;
const TARGET = __ENV.TARGET ? __ENV.TARGET : 1000;
const DURATION = __ENV.DURATION ? __ENV.DURATION : '10m';

const HEADERS = {Accept: "*/*", Authorization: BASIC_AUTH, 'Cache-Control': 'only-if-cached'}

const MAX_VUS = 90000;

const STAGES = [
  { target: TARGET, duration: '10m' },
  { target: TARGET, duration: DURATION }
];

export let options = {
  tags: {
    testid: `MultiReaderWrongResidency-${TARGET}-${DURATION}-${Date.now()}`,
  },
  setupTimeout: '900s',
  discardResponseBodies: false,
  summaryTrendStats: ["avg", "min", "max", "p(1)", "p(10)", "p(25)", "p(50)", "p(75)" , "p(90)", "p(95)", "p(99)"],
  scenarios: {
    hdb: {
      executor: 'ramping-arrival-rate',
      exec: 'hdb',
      preAllocatedVUs: 100,
      maxVUs: MAX_VUS,
      stages: STAGES
    }
  },
};

export function hdb() {
  callHDB(DOMAIN);
}

function callHDB(domain) {
  let id = randomItem(data);
  const matchId = id.match(/itemId=([\d.]+)/);
  const shardNumber = (matchId[1] % 10) +1;

  const randomNumber = getRandomNumberExcludingOne(shardNumber);
  //determine appropriate shard number
  //console.log(id, shardNumber, randomNumber);
  const num = randomNumber < 10 ? '0' + randomNumber : randomNumber;
  let request_url = `${domain.replace('{SN}', num)}:${HTTP_PORT}/shardnado/${id}`;

  const res = http.get(request_url, { headers: HEADERS,
    tags: { name: 'Harper', shardNumber} });

  let serverTimingHeader = res.headers["Server-Timing"];
  let timings = serverTimingHeader.split(",");
  timings.forEach((timing) => {
    let matchHdb = serverTimingHeader.match(/hdb;dur=([\d.]+)/); // Match the specific timing
    if(matchHdb) {
      let duration = parseFloat(matchHdb[1]);
      trendHDB.add(duration);
    }

  });

  check(res, {
    "status is 200": (r) => r.status == 200,
    "check is hit": (r) => !res.headers["Server-Timing"].includes('cache-resolve;dur='),
  });
}

function getRandomNumberExcludingOne(excludeNumber) {
  let randomNumber;
  do {
    randomNumber = Math.floor(Math.random() * 10) + 1;
  } while (randomNumber === excludeNumber);
  return randomNumber;
}