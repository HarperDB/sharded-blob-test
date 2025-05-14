import {writeFileSync} from 'fs';

let allRecords = []
for(let x = 1; x < 11; x++) {
  let insNum = x < 10 ? `0${x}` : x;
  let response = await fetch(`https://shard-nado-us-lax${insNum}.harperdbcloud.com/Shardnado/?select(cacheKey)&limit(100000)`, {
    method: "GET", headers: {Authorization: "Basic SERCX0FETUlOOlBjdHY+Q0MyRmJodUFZQmEtTlJYWmlIe2dvbEd6ezdrTUBIUXBVPj5vOXp4dzBVSGZVPEVQQ0ZXbmwoUC1BPT8="}
  });
  let records = await response.json()
  console.log(records.length);

  allRecords = allRecords.concat(records);

}
writeFileSync('records.json', JSON.stringify(allRecords));