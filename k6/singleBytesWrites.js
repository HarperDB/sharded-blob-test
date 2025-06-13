import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import exec from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

let trendHDB = new Trend("trendHDB", true);
let trendCacheMiss = new Trend("trendCacheMiss", true);

const shardCounter = new Counter('shardCounter', {});

const DOMAIN = __ENV.DOMAIN ? __ENV.DOMAIN : "http://localhost";
const BASIC_AUTH = __ENV.BASIC_AUTH ? __ENV.BASIC_AUTH : "Basic SERCX0FETUlOOjE0MDA=";
const HTTP_PORT = __ENV.HTTP_PORT ? __ENV.HTTP_PORT : 9926;
const TARGET = __ENV.TARGET ? __ENV.TARGET : 1000;
const DURATION = __ENV.DURATION ? __ENV.DURATION : '10m';

const HEADERS = {Accept: "*/*", Authorization: BASIC_AUTH, 'Cache-Control': 'no-cache'}

const MAX_VUS = 90000;

const STAGES = [
	{ target: TARGET, duration: '10m' },
	{ target: TARGET, duration: DURATION }
];

export let options = {
	tags: {
		testid: `SingleBytesWrites-${TARGET}-${DURATION}-${new Date().toUTCString()}`,
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

export function hdb(data) {
	callHDB(data, DOMAIN);
}
let iterationCount = 0;
function callHDB(data, domain) {
	let id = generateId(data);

	let request_url = `${domain}:${HTTP_PORT}/bytedata/${id}`;
	const res = http.get(request_url, { headers: HEADERS,
		tags: { name: 'Harper'} });

	let serverTimingHeader = res.headers["Server-Timing"];
	let timings = serverTimingHeader.split(",");
	timings.forEach((timing) => {
		let matchHdb = serverTimingHeader.match(/hdb;dur=([\d.]+)/); // Match the specific timing
		if(matchHdb) {
			let duration = parseFloat(matchHdb[1]);
			trendHDB.add(duration);
		}

		let matchCacheResolve = serverTimingHeader.match(/cache-resolve;dur=([\d.]+)/); // Match the specific timing
		if(matchCacheResolve) {
			let duration = parseFloat(matchCacheResolve[1]);
			trendCacheMiss.add(duration);
		} else {
			//hitCounter.add(1);
		}
	});

	check(res, {
		"status is 200": (r) => r.status == 200,
		"check is miss": (r) => res.headers["Server-Timing"].includes('cache-resolve;dur='),
	});
}

function generateId(data) {
	let itemId = exec.scenario.iterationInTest + exec.vu.idInTest;
	let shardNumber = (itemId % 10) +1
	shardCounter.add(1, { shard: shardNumber });
	return `startTime=${exec.scenario.startTime}&vuId=${exec.vu.idInTest}&itemId=${itemId}`
}