const {
  readCert,
  writeCertToDisk,
  certificatesInDirectory
} = require("./diskUtils");
const { dirSync } = require("tmp");
const mkdirp = require("mkdirp");
const { issueCertificate } = require("@govtechsg/open-certificate");
const { combinedHash, hashToBuffer } = require("./crypto");
const { logger } = require("../lib/logger");

/**
 * 
 * @param {*} undigestedCertDir 
 * @param {*} digestedCertDir 
 * @returns {Array} an array containing all the targetHashes of the certs inside undigestedCertDir
 */
const digestCertificate = async (undigestedCertDir, digestedCertDir) => {
  const hashArray = [];
  const certFileNames = await certificatesInDirectory(undigestedCertDir);
  logger.debug(`Digesting certificates: ${certFileNames}`)
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

const appendProofToCerts = async (
  intermediateDir,
  digestedCertDir,
  hashMap
) => {
  const certFileNames = await certificatesInDirectory(intermediateDir);
  let merkleRoot;
  certFileNames.forEach(file => {
    const certificate = readCert(intermediateDir, file);

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

    const layerLength = currentLayer.length;
    for (let i = 0; i < layerLength - 1; i += 2) {
      const element1 = currentLayer[i];
      const element2 = currentLayer[i + 1];

      const nextHash = combinedHash(element1, element2);

      // element1 = left
      // element2 = right
      // nextHash = parent

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
  // Create output dir
  logger.debug(`Issuing batch with inputDir: ${inputDir}, outputDir: ${outputDir} `)
  mkdirp.sync(outputDir);

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });
  logger.debug(`Created tmp dir at ${intermediateDir}`)

  // Phase 1: For each certificate, read content, digest and write to file
  const individualCertificateHashes = await digestCertificate(
    inputDir,
    intermediateDir
  );

  if (!individualCertificateHashes || individualCertificateHashes.length === 0)
    throw new Error(`No certificates found in ${inputDir}`);
  if (individualCertificateHashes.length === 1)
    throw new Error(`No need to batch certificate if there is only one`);

  // Phase 2: Efficient merkling to build hashmap
  const hashMap = merkleHashmap(individualCertificateHashes);

  // Phase 3: Add proofs to signedCertificates
  const merkleRoot = await appendProofToCerts(
    intermediateDir,
    outputDir,
    hashMap,
    () => removeCallback()
  );

  // Remove intermediate dir
  removeCallback();

  return merkleRoot;
};

module.exports = {
  digestCertificate,
  appendProofToCerts,
  merkleHashmap,
  batchIssue
};
