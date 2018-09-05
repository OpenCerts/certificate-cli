const fs = require("fs");
const path = require("path");
const util = require("util");
const {
  issueCertificates,
  certificateData
} = require("@govtechsg/open-certificate");

const { get } = require("lodash");

const readdir = util.promisify(fs.readdir);

function readCert(directory, filename) {
  return JSON.parse(fs.readFileSync(path.join(directory, filename)));
}

function setFilename(filenameMap, documentId, filename) {
  if (documentId in filenameMap) {
    throw new Error(
      "There are duplicate IDs in the certificates to be batched up, please ensure that the ID fields in the certificates are unique."
    );
  } else {
    return Object.assign(filenameMap, { [documentId]: filename });
  }
}

function getRawCertificates(unsignedCertDir) {
  const unsignedCertDirPath = path.resolve(unsignedCertDir);
  return readdir(unsignedCertDirPath).then(items => {
    let filenameMap = {};
    const certificates = items.map(filename => {
      const document = readCert(unsignedCertDirPath, filename);
      filenameMap = setFilename(filenameMap, document.id, filename);
      return document;
    });
    return { filenameMap, certificates };
  });
}

function getBatchRoot(documents) {
  const merkleRoots = documents.map(doc => get(doc, "signature.merkleRoot"));

  const setOfRoots = new Set(merkleRoots);
  if (setOfRoots.size > 1) {
    throw new Error(
      "Unexpected error: Merkel roots of certificates in the same batch differ."
    );
  } else if (setOfRoots.has(undefined) || setOfRoots.size === 0) {
    throw new Error("No signatures found in batch.");
  } else return merkleRoots[0];
}

function writeCertToDisk(destinationDir, filename, certificate) {
  fs.writeFileSync(
    path.join(path.resolve(destinationDir), filename),
    JSON.stringify(certificate, null, 2)
  );
}

function makeFilename(filenameMap, certificate) {
  const certData = certificateData(certificate); // get unsalted document data to retrieve ID
  return filenameMap[certData.id];
}

function batchIssue(inputDir, outputDir) {
  return getRawCertificates(inputDir).then(documents => {
    const batch = issueCertificates(documents.certificates);
    const batchRoot = getBatchRoot(batch);

    batch.forEach(certificate => {
      const signedCertFilename = makeFilename(
        documents.filenameMap,
        certificate
      );
      writeCertToDisk(outputDir, signedCertFilename, certificate);
    });
    return batchRoot;
  });
}

module.exports = batchIssue;
