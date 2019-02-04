const ethereumjsUtil = require("ethereumjs-util");

/*
* FUNCTIONS TAKEN FROM OPEN_ATTESTATION FRAMEWORK
*/

/**
 * Sorts the given Buffers lexicographically and then concatenates them to form one continuous Buffer
 * @param {[Buffer]} args The buffers to concatenate
 */
function bufSortJoin(...args) {
  return Buffer.concat([...args].sort(Buffer.compare));
}

/**
 * Returns the keccak hash of two buffers after concatenating them and sorting them
 * If either hash is not given, the input is returned
 * @param {Buffer} first A buffer to be hashed
 * @param {Buffer} second A buffer to be hashed
 */
function combinedHash(first, second) {
  if (!second) {
    return first;
  }
  if (!first) {
    return second;
  }
  return ethereumjsUtil.keccak256(bufSortJoin(first, second));
}

/**
 * Returns a buffer of a given hash string
 * @param {Buffer} hash A hex string to be hashed (should not start with 0x)
 */
function hashToBuffer(hash) {
  return Buffer.isBuffer(hash) && hash.length === 32
    ? hash
    : Buffer.from(hash, "hex");
}

module.exports = {
  bufSortJoin,
  combinedHash,
  hashToBuffer
};
