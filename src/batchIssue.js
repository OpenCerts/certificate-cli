const {
  readCert,
  writeCertToDisk,
  documentsInDirectory
} = require("./diskUtils");
const { dirSync } = require("tmp");
const mkdirp = require("mkdirp");
const { issueDocument } = require("@govtechsg/tradetrust-schema");
const { combinedHash, hashToBuffer } = require("./crypto");

const digestDocument = async (undigestedCertDir, digestedCertDir) => {
  const hashArray = [];
  const certFileNames = await documentsInDirectory(undigestedCertDir);
  certFileNames.forEach(file => {
    // Read individual document
    const document = readCert(undigestedCertDir, file);
    // Digest individual document
    const digest = issueDocument(document);
    hashArray.push(hashToBuffer(digest.signature.merkleRoot));
    // Write digested document to new directory
    writeCertToDisk(digestedCertDir, file, digest);
  });
  return hashArray;
};

const appendProofToCerts = async (
  intermediateDir,
  digestedCertDir,
  hashMap
) => {
  const certFileNames = await documentsInDirectory(intermediateDir);
  let merkleRoot;
  certFileNames.forEach(file => {
    const document = readCert(intermediateDir, file);

    const documentHash = document.signature.targetHash;
    const proof = [];
    let candidateRoot = documentHash;
    let nextStep = hashMap[documentHash];
    while (nextStep) {
      // nextStep will be empty when there is no parent
      proof.push(nextStep.sibling);
      candidateRoot = nextStep.parent;
      nextStep = hashMap[candidateRoot];
    }

    document.signature.proof = proof;
    document.signature.merkleRoot = candidateRoot;
    if (!merkleRoot) merkleRoot = candidateRoot;

    writeCertToDisk(digestedCertDir, file, document);
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

  // Phase 1: For each document, read content, digest and write to file
  const individualDocumentHashes = await digestDocument(
    inputDir,
    intermediateDir
  );

  if (!individualDocumentHashes || individualDocumentHashes.length === 0)
    throw new Error(`No documents found in ${inputDir}`);

  // Phase 2: Efficient merkling to build hashmap
  const hashMap = merkleHashmap(individualDocumentHashes);

  // Phase 3: Add proofs to signedDocuments
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
  digestDocument,
  appendProofToCerts,
  merkleHashmap,
  batchIssue
};
