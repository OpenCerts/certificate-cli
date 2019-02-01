const { getRawCertificates, writeCertToDisk } = require("./diskUtils");
const fs = require("fs");
const path = require("path");
const util = require("util");
const mkdirp = require("mkdirp");
const ethereumjsUtil = require("ethereumjs-util");
const {
  issueCertificate,
  issueCertificates,
  certificateData
} = require("@govtechsg/open-certificate");

const CERTIFICATES = "./load/unsigned/";
const CERTIFICATES_SIGNED = "./load/signed/";

const readdir = util.promisify(fs.readdir);

function readCert(directory, filename) {
  return JSON.parse(fs.readFileSync(path.join(directory, filename)));
}

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
  return ethereumjsUtil.sha3(bufSortJoin(first, second));
}

// If hash is not a buffer, convert it to buffer (without hashing it)
function hashToBuffer(hash) {
  return Buffer.isBuffer(hash) && hash.length === 32
    ? hash
    : Buffer.from(hash, "hex");
}

/*
function writeCertToDisk(destinationDir, filename, certificate) {
  fs.writeFileSync(
    path.join(path.resolve(destinationDir), filename),
    JSON.stringify(certificate, null, 2)
  );
} */

describe.only("Test", () => {
  it("works", async () => {
    // const res = await getRawCertificates(CERTIFICATES);
    console.time("TIME");
    const res = await readdir(CERTIFICATES);
    console.timeLog("TIME");

    mkdirp.sync(CERTIFICATES_SIGNED);

    // Create map for name to hash;
    const fileMap = {};
    const hashMap = {};
    const hashArray = [[]];

    // Phase 1: For each certificate, read content, digest and write to file
    res.forEach(file => {
      // Read
      const certificate = readCert(CERTIFICATES, file);
      // Digest
      const digest = issueCertificate(certificate);
      hashArray[0].push(hashToBuffer(digest.signature.merkleRoot));
      fileMap[file] = digest.signature.merkleRoot;
      // Write
      writeCertToDisk(CERTIFICATES_SIGNED, file, digest);
    });
    console.timeLog("TIME");

    // Phase 2: Efficient merkling to build hashmap
    let merklingCompleted = false;
    while (!merklingCompleted) {
      const currentLayerIndex = hashArray.length - 1;
      const nextLayerIndex = hashArray.length;
      const currentLayer = hashArray[currentLayerIndex];
      hashArray.push([]);

      const layerLenght = currentLayer.length;
      for (let i = 0; i < layerLenght - 1; i += 2) {
        const element1 = currentLayer[i];
        const element2 = currentLayer[i + 1];

        const nextHash = combinedHash(element1, element2);

        hashMap[element1.toString("hex")] = {
          w: element2.toString("hex"),
          n: nextHash.toString("hex")
        };
        hashMap[element2.toString("hex")] = {
          w: element1.toString("hex"),
          n: nextHash.toString("hex")
        };

        hashArray[nextLayerIndex].push(nextHash);
      }
      // If odd number, push last element to next layer
      if (currentLayer.length % 2 === 1) {
        hashArray[nextLayerIndex].push(currentLayer[currentLayer.length - 1]);
      }

      if (hashArray[nextLayerIndex].length === 1) merklingCompleted = true;
    }

    console.timeLog("TIME");

    // Phase 3: Add proofs to signedCertificates
    const res2 = await readdir(CERTIFICATES_SIGNED);
    res.forEach(file => {
      // Read
      const certificate = readCert(CERTIFICATES_SIGNED, file);

      const certificateHash = certificate.signature.targetHash;
      const proof = [];
      let root = certificateHash;
      let nextStep = hashMap[certificateHash];
      while (nextStep) {
        proof.push(nextStep.w);
        root = nextStep.n;
        nextStep = hashMap[root];
      }

      certificate.signature.proof = proof;
      certificate.signature.merkleRoot = root;

      writeCertToDisk(CERTIFICATES_SIGNED, file, certificate);
    });

    // console.log(hashMap);
    console.timeLog("TIME");
  }).timeout(20000);
});
