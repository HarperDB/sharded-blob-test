import http from 'k6/http';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import encoding from 'k6/encoding';

const username = 'HDB_ADMIN';
const password = '1400'//'s9UF:KP>S00A#ErqGBgFCHVXLV=]>_Cb@(ZlciTlYquk4764-Xg1>Nt7+6u&-ht4';
const encodedCredentials = encoding.b64encode(`${username}:${password}`);
const HEADERS = {'Content-Type': "application/json", Authorization: `Basic ${encodedCredentials}`}


const STAGES = [
	{ target: 5, duration: '10m' },
	//{ target: TARGET, duration: DURATION }
];

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
	const res = http.post('http://localhost:9926/itemattributes/', JSON.stringify(createItemAttributes()), { headers: HEADERS,
		tags: { name: 'Harper'} });
	console.log(res.status)
}

function createItemAttributes() {
	let payload = [];
	for(let i = 0; i < 500; i++) {
		payload.push( {
			"cacheKey": `itemId=${randomIntBetween(1000,100000000)}5&sellerId=${randomIntBetween(1000,100000000)}`,
			"title": `Bulk Item ${randomIntBetween(1,1000)}`,
			"brand": "BrandX",
			"availabilityStatus": "OUT_OF_STOCK",
			"currentPrice":`${randomIntBetween(1,500)}.00`,
			"wasPrice": `$${randomIntBetween(1,500)}.00`,
			"imageUrl": "https://lorempixel.com/g/1366/768/business/"
		});
	}
	return payload;
}