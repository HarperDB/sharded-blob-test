const {Shardnado} = databases.shard;

const {replication} = server.config;
const NODE_NAME = replication.hostname;

//sample id: itemId=10052100863&deviceType=desktop&upstream=www.walmart.com
/*Shardnado.setResidencyById((id ) => {
  let matchId = id.match(/itemId=([\d.]+)/);
  const lastDigit = (matchId[1] % 10) +1;
  //return lastDigit
  console.log((matchId[1] % 2) + 1 )
  return (matchId[1] % 2) + 1;
});*/

Shardnado.setResidency((record ) => {
  const id = record.cacheKey;
  let matchId = id.match(/itemId=([\d.]+)/);
  const lastDigit = (matchId[1] % 10) +1;
  //return lastDigit;
  console.log((matchId[1] % 2) + 1 )
  return (matchId[1] % 2) + 1;
});
