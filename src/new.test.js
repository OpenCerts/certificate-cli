const {
  readCert,
  writeCertToDisk,
  certificatesInDirectory
} = require("./diskUtils");
const mkdirp = require("mkdirp");
const { issueCertificate } = require("@govtechsg/open-certificate");
const { combinedHash, hashToBuffer } = require("./crypto");

const CERTIFICATES = "./load/unsigned/";
const CERTIFICATES_SIGNED = "./load/signed/";

/*
describe("Test Cert", () => {
  it("works", () => {
    const cert = require("../load/signed/cert.json");
    console.log(verifySignature(cert));
    console.log(validateSchema(cert));
  });
});
*/

describe("Test", () => {
  it("works", async () => {
    console.time("TIME");

    // Get array of all certificate files in directory
    const certFileNames = await certificatesInDirectory(CERTIFICATES);
    mkdirp.sync(CERTIFICATES_SIGNED);

    console.timeLog("TIME");

    // Create map for name to hash;
    const fileMap = {};
    const hashMap = {};
    const hashArray = [[]];

    // Phase 1: For each certificate, read content, digest and write to file
    certFileNames.forEach(file => {
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
    certFileNames.forEach(file => {
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
  }).timeout(200000000);
});
