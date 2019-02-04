const {
  readCert,
  writeCertToDisk,
  certificatesInDirectory
} = require("./diskUtils");
const mkdirp = require("mkdirp");
const { issueCertificate } = require("@govtechsg/open-certificate");
const { combinedHash, hashToBuffer } = require("./crypto");

const digestCertificate = async (undigestedCertDir, digestedCertDir) => {
  const hashArray = [];
  const certFileNames = await certificatesInDirectory(undigestedCertDir);
  certFileNames.forEach(file => {
    // Read individual certificate
    const certificate = readCert(undigestedCertDir, file);
    // Digest individual certificate
    const digest = issueCertificate(certificate);
    hashArray.push(hashToBuffer(digest.signature.merkleRoot));
    // Write digested certificate to new directory
    writeCertToDisk(digestedCertDir, file, digest);
  });
  return hashArray;
};

const appendProofToCerts = async (digestedCertDir, hashMap) => {
  const certFileNames = await certificatesInDirectory(digestedCertDir);
  let merkleRoot;
  certFileNames.forEach(file => {
    const certificate = readCert(digestedCertDir, file);

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
    if (!merkleRoot) merkleRoot = root;

    writeCertToDisk(digestedCertDir, file, certificate);
  });
  return merkleRoot;
};

const merkleHashmap = leafHashes => {
  const hashMap = {};
  const hashArray = [leafHashes];

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

  return hashMap;
};

const batchIssue = async (inputDir, outputDir) => {
  mkdirp.sync(outputDir);

  // Phase 1: For each certificate, read content, digest and write to file
  const individualCertificateHashes = await digestCertificate(
    inputDir,
    outputDir
  );

  // Phase 2: Efficient merkling to build hashmap
  const hashMap = merkleHashmap(individualCertificateHashes);

  // Phase 3: Add proofs to signedCertificates
  return appendProofToCerts(outputDir, hashMap);
};

module.exports = {
  digestCertificate,
  appendProofToCerts,
  merkleHashmap,
  batchIssue
};
