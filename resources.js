import { randomBytes } from 'crypto';
let random = randomBytes(215000);
const TTL = 4 * 30 * 24 * 60 * 60 * 1000;

const {Shardnado} = databases.shard;

const {replication} = server.config;
const NODE_NAME = replication.hostname;

server.http(async (request, next_handler) => {
  let response = await next_handler(request);
  console.log(NODE_NAME)
  response.headers?.set('HDB-Node-Name', NODE_NAME);
  return response;
}, { runFirst: true });

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
  //return (matchId[1] % 10) +1;

  console.log('shard residency', (matchId[1] % 2) + 1 )
  return (matchId[1] % 2) + 1;
});

export class shardnado extends Shardnado {
  async get() {
    return {
      status: this.httpStatus,
      headers: {},
      body: this.htmlContent
    };
  }

}

export class ShardSource extends Resource {
  async get() {
    const expiresAt = Date.now() + TTL;
    const context = this.getContext();
    context.expiresAt = expiresAt;

    let blob = await createBlob(random.subarray(0,
      Math.floor(Math.random() * (215000 - 150000 + 1)) + 150000
    ));

    return {
      htmlContent: blob,
      encoding: "gzip",
      contentSize: blob.size,
      ttl: TTL,
      expiresAtTimestamp: new Date(expiresAt).toISOString(),
      updatedTimestamp: new Date().toISOString(),
      httpStatus: 200
    }
  }
}

shardnado.sourcedFrom(ShardSource);
