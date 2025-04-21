import { randomBytes } from 'crypto';
let random = randomBytes(215000);
const TTL = 4 * 30 * 24 * 60 * 60 * 1000;

const {Shardnado} = databases.shard;

//sample id: itemId=10052100863&deviceType=desktop&upstream=www.walmart.com
Shardnado.setResidencyById((id ) => {
  let matchId = id.match(/itemId=([\d.]+)/);
  //create a partition of 1-10 based on itemid last digit
  //return Math.round(((matchId[1] % 10) +1) / 2);
  return (matchId[1] % 10) +1;
});

export class shardcount extends Shardnado {
  async get(id) {
    const results = await Shardnado.search({select: ['cacheKey'], conditions: [
        { attribute: 'updatedTimestamp', comparator: 'greater_than', value: this.getId() }
      ]});
    let count = 0;
    for await(const entry of  results) {
      count++;
    }
    return {count };
  }
}

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
      updatedTimestamp: new Date(),
      httpStatus: 200
    }
  }
}

shardnado.sourcedFrom(ShardSource);
