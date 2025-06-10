import {writeFileSync} from 'fs';

let allRecords = []

for (let x = 1; x < 11; x++) {
    let insNum = x < 10 ? `0${x}` : x;

    try {
        let response = await fetch(`https://shard-nado-us-lax${insNum}.harperdbcloud.com:9925/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic SERCX0FETUlOOlBjdHY+Q0MyRmJodUFZQmEtTlJYWmlIe2dvbEd6ezdrTUBIUXBVPj5vOXp4dzBVSGZVPEVQQ0ZXbmwoUC1BPT8="
            },
            body: JSON.stringify({
                operation: "search_by_value",
                search_attribute: "cacheKey",
                search_value: "*",
                get_attributes: ["cacheKey"],
                database: "shard",
                table: "Shardnado",
                limit: 10000000,
                replicateFrom: false
            }),
            signal: AbortSignal.timeout(300000) //abort after 5 minutes: 300000 ms
        });

        let records = await response.json();
        const cacheKeys = records.map(item => item.cacheKey);
        console.log(`node ${insNum}: ${cacheKeys.length}`);
        allRecords = allRecords.concat(cacheKeys);
    } catch (err) {
        console.log(err);
    }
}
console.log(allRecords.length + ' total records');
writeFileSync('records_mihai.json', JSON.stringify(allRecords));