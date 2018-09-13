const { getRawCertificates, writeCertToDisk } = require("./diskUtils");

const {
  issueCertificates,
  certificateData
} = require("@govtechsg/open-certificate");

const { get, sortedUniq } = require("lodash");

function getBatchRoot(documents) {
  const merkleRoots = documents.map(doc => get(doc, "signature.merkleRoot"));

  const setOfRoots = new Set(merkleRoots);
  if (setOfRoots.size > 1) {
    throw new Error(
      "Unexpected error: Merkle roots of certificates in the same batch differ."
    );
  } else if (setOfRoots.has(undefined) || setOfRoots.size === 0) {
    throw new Error("No signatures found in batch.");
  } else return merkleRoots[0];
}

function makeFilename(filenameMap, certificate) {
  const certData = certificateData(certificate); // get unsalted document data to retrieve ID
  return filenameMap[certData.id];
}

function checkForDuplicateIDs(documents) {
  const IDs = documents.map(doc => get(doc, "id"));
  const removedDuplicateIDs = sortedUniq(IDs);

  if (IDs.length !== removedDuplicateIDs.length) {
    throw new Error(
      "There were duplicate document IDs found in the certificates, please ensure that the IDs are unique"
    );
  }
}

async function batchIssue(inputDir, outputDir) {
  const documents = await getRawCertificates(inputDir);

  checkForDuplicateIDs(documents.certificates);
  const batch = issueCertificates(documents.certificates);
  const batchRoot = getBatchRoot(batch);

  batch.forEach(certificate => {
    const signedCertFilename = makeFilename(documents.filenameMap, certificate);
    writeCertToDisk(outputDir, signedCertFilename, certificate);
  });
  return batchRoot;
}

module.exports = batchIssue;
