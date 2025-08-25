import http from 'k6/http';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import encoding from 'k6/encoding';
import { Trend, Counter, Gauge } from "k6/metrics";
const username = 'HDB_ADMIN';
const password = 's9UF:KP>S00A#ErqGBgFCHVXLV=]>_Cb@(ZlciTlYquk4764-Xg1>Nt7+6u&-ht4';
const encodedCredentials = encoding.b64encode(`${username}:${password}`);
const HEADERS = {'Content-Type': "application/json", Authorization: `Basic ${encodedCredentials}`}
let trendHDB = new Trend("trendHDB", true);
let trendCacheMiss = new Trend("trendCacheMiss", true);

export const options = {
	summaryTrendStats: ["avg", "min", "max", "p(1)", "p(10)", "p(25)", "p(50)", "p(75)" , "p(90)", "p(95)", "p(99)"],
	scenarios: {
		hdb: {
			executor: 'constant-arrival-rate',
			preAllocatedVUs: 100,
			maxVUs: 1000,
			rate: 1,
			timeUnit: '1s',
			duration: '10m'
		}
	}
};

export default function () {
	let [id, shardNumber] = generateId();
console.log(id, shardNumber)
	const res = http.get(`https://hdb-shard-us-iad01-${shardNumber}.harperdbcloud.com:9926/shardnado/${id}`,  { headers: HEADERS,
		tags: { name: 'Harper'} });
	console.log(res.status)

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
}

function generateId() {
	let itemId = randomIntBetween(1000, 100000000000);
	let shardNumber = (itemId % 10)
	shardNumber = shardNumber > 0 ? '0' + shardNumber : 10;
	return [`itemId=${itemId}&sellerId=${randomIntBetween(1000, 100000000000)}`, shardNumber];
}