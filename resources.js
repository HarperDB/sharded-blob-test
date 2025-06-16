import { randomBytes } from 'crypto';

const TTL = 4 * 30 * 24 * 60 * 60 * 1000;

const minSize = 150000;
const maxSize = 215000;
let random = randomBytes(maxSize);

const noOfHarperNodes = 10;        //cluster has 10 harperdb nodes (shard 1, 2 ... 10)
const firstHarperNodeNumber = 1;  //first node is shard 1


const {Shardnado, BlobData, ByteData} = databases.shard;

//sample id: itemId=10052100863&deviceType=desktop&upstream=www.walmart.com
/**
 * Extracts the item ID from the `cacheKey` in the provided record and calculates a partition value
 * based on the last digit of the item ID.
 *
 * @param {Object} record - The object containing the `cacheKey` string property.
 * @param {string} record.cacheKey - String that contains the item ID within it.
 * @returns {number} The partition value derived from the last digit of the item ID.
 */

Shardnado.setResidency((record ) => {
  let matchId = record.cacheKey.match(/itemId=([\d.]+)/);
  return (matchId[1] % noOfHarperNodes) + firstHarperNodeNumber;
});

/*Shardnado.setResidencyById((id ) => {
  let matchId = id.match(/itemId=([\d.]+)/);
  //create a partition of 1-10 based on itemid last digit
  //return Math.round(((matchId[1] % 10) +1) / 2);
  return (matchId[1] % noOfHarperNodes) + firstHarperNodeNumber;
});
*/

//
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
      Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
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

export class blobdata extends BlobData {
  async get() {
    return {
      status: this.httpStatus,
      headers: {},
      body: this.htmlContent
    };
  }
}

export class BlobSource extends Resource {
  async get() {
    const expiresAt = Date.now() + TTL;
    const context = this.getContext();
    context.expiresAt = expiresAt;

    let blob = await createBlob(random.subarray(0,
      Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
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

blobdata.sourcedFrom(BlobSource);

export class bytedata extends ByteData {
  async get() {
    return {
      status: this.httpStatus,
      headers: {},
      body: this.htmlContent
    };
  }
}

export class ByteSource extends Resource {
  async get() {
    const expiresAt = Date.now() + TTL;
    const context = this.getContext();
    context.expiresAt = expiresAt;

    let bytes = random.subarray(0,
      Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
    );

    return {
      htmlContent: bytes,
      encoding: "gzip",
      contentSize: bytes.size,
      ttl: TTL,
      expiresAtTimestamp: new Date(expiresAt).toISOString(),
      updatedTimestamp: new Date(),
      httpStatus: 200
    }
  }
}

bytedata.sourcedFrom(ByteSource);
