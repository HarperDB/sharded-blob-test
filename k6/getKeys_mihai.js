import {writeFileSync} from 'fs';

let allRecords = []

for (let x = 1; x < 11; x++) {
    let insNum = x < 10 ? `0${x}` : x;

    try {
        console.log("Get keys from node: " + insNum);
        // let response = await fetch(`https://shard-nado-us-lax${insNum}.harperdbcloud.com/Shardnado/?select(cacheKey)&limit(100)`, {
        //     method: "GET",
        //     headers: {Authorization: "Basic SERCX0FETUlOOlBjdHY+Q0MyRmJodUFZQmEtTlJYWmlIe2dvbEd6ezdrTUBIUXBVPj5vOXp4dzBVSGZVPEVQQ0ZXbmwoUC1BPT8="},
        //     signal: AbortSignal.timeout(12000)
        // });

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
                limit: 100
            }),
            signal: AbortSignal.timeout(12000) //abort after 5 minutes: 300000 ms
        });


        //8.994.108 records generated with multiRightWrites.js

        let records = await response.json();


        // //this is for GET req above
        // console.log(records.length);
        // allRecords = allRecords.concat(records);


        //this is for POST req above
        const cacheKeys = records.map(item => item.cacheKey);
        console.log(cacheKeys.length + ' keys on node ' + insNum);
        allRecords = allRecords.concat(cacheKeys);


    } catch (err) {
        console.log(err);
    }
}
console.log(allRecords.length + ' total records');
writeFileSync('records_mihai.json', JSON.stringify(allRecords));