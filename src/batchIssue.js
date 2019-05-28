const {
  readCert,
  writeCertToDisk,
  certificatesInDirectory
} = require("./diskUtils");
const { dirSync } = require("tmp");
const mkdirp = require("mkdirp");
const { issueCertificate } = require("@tradetrust/tradetrust-certificate");
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
    let candidateRoot = certificateHash;
    let nextStep = hashMap[certificateHash];
    while (nextStep) {
      // nextStep will be empty when there is no parent
      proof.push(nextStep.sibling);
      candidateRoot = nextStep.parent;
      nextStep = hashMap[candidateRoot];
    }

    certificate.signature.proof = proof;
    certificate.signature.merkleRoot = candidateRoot;
    if (!merkleRoot) merkleRoot = candidateRoot;

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

      hashMap[element1.toString("hex")] = {
        sibling: element2.toString("hex"),
        parent: nextHash.toString("hex")
      };
      hashMap[element2.toString("hex")] = {
        sibling: element1.toString("hex"),
        parent: nextHash.toString("hex")
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
  mkdirp.sync(outputDir);

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });

  // Phase 1: For each certificate, read content, digest and write to file
  const individualCertificateHashes = await digestCertificate(
    inputDir,
    intermediateDir
  );

  if (!individualCertificateHashes || individualCertificateHashes.length === 0)
    throw new Error(`No certificates found in ${inputDir}`);

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
