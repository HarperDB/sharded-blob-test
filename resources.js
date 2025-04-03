import { randomBytes } from 'crypto';
let random = randomBytes(215000);
const TTL = 4 * 30 * 24 * 60 * 60 * 1000;

const {Shardnado} = databases.shard;

//sample id: itemId=10052100863&deviceType=desktop&upstream=www.walmart.com
Shardnado.setResidency((record ) => {
  let matchId = record.cacheKey.match(/itemId=([\d.]+)/);
  //create a partition of 1-5 based on itemid last digit
  return Math.round(((matchId[1] % 10) +1) / 2);
});

/*Shardnado.setResidency((record ) => {
  const id = record.cacheKey;
  let matchId = id.match(/itemId=([\d.]+)/);
  //return (matchId[1] % 10) +1;

  //console.log('shard residency', (matchId[1] % 2) + 1 )
  return (matchId[1] % 2) + 1;
});*/

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
