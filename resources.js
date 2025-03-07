const {Shardnado} = databases.shard;

//sample id: itemId=10052100863&deviceType=desktop&upstream=www.walmart.com
/*Shardnado.setResidencyById((id ) => {
  let matchId = id.match(/itemId=([\d.]+)/);
  const lastDigit = (matchId[1] % 10) +1;
  //return [`lax${lastDigit}`, `ord${lastDigit}`]
  console.log(matchId[1] % 2 === 0 ? ['shard1'] : ['shard2'])
  return matchId[1] % 2 === 0 ? ['shard1'] : ['shard2'];
});*/

Shardnado.setResidency((record ) => {
  const id = record.cacheKey;
  let matchId = id.match(/itemId=([\d.]+)/);
  const lastDigit = (matchId[1] % 10) +1;
  //return [`lax${lastDigit}`, `ord${lastDigit}`]
  console.log(matchId[1] % 2 === 0 ? ['shard1'] : ['shard2'])
  return matchId[1] % 2 === 0 ? ['shard1'] : ['shard2'];
});
