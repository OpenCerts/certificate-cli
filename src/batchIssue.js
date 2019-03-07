const {
  readCert,
  writeCertToDisk,
  certificatesInDirectory
} = require("./diskUtils");
const { dirSync } = require("tmp");
const mkdirp = require("mkdirp");
const { issueCertificate, MerkleTree } = require("@govtechsg/open-certificate");
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
  logger.debug(`Digesting certificates: ${certFileNames}`);
  certFileNames.forEach(file => {
    // Read individual certificate
    const certificate = readCert(undigestedCertDir, file);
    // Digest individual certificate
    const digest = issueCertificate(certificate);
    hashArray.push(Buffer.from(digest.signature.merkleRoot, "hex"));
    // Write digested certificate to new directory
    writeCertToDisk(digestedCertDir, file, digest);
  });
  return hashArray;
};

const bufferToAscii = buffer => buffer.hexSlice();
const asciiToBuffer = ascii => Buffer.from(ascii, "hex");

const appendProofToCerts = async (
  intermediateDir,
  digestedCertDir,
  merkleTree
) => {
  const certFileNames = await certificatesInDirectory(intermediateDir);
  certFileNames.forEach(file => {
    const certificate = readCert(intermediateDir, file);

    const certificateHashString = certificate.signature.targetHash;

    certificate.signature.proof = merkleTree
      .getProof(asciiToBuffer(certificateHashString))
      .map(bufferToAscii);

    certificate.signature.merkleRoot = merkleTree.getRoot().hexSlice();

    writeCertToDisk(digestedCertDir, file, certificate);
  });

  return merkleTree.getRoot().hexSlice();
};

const batchIssue = async (inputDir, outputDir) => {
  // Create output dir
  logger.debug(
    `Issuing batch with inputDir: ${inputDir}, outputDir: ${outputDir} `
  );
  mkdirp.sync(outputDir);

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });
  logger.debug(`Created tmp dir at ${intermediateDir}`);

  // Phase 1: For each certificate, read content, digest and write to file
  const individualCertificateHashes = await digestCertificate(
    inputDir,
    intermediateDir
  );

  if (!individualCertificateHashes || individualCertificateHashes.length === 0)
    throw new Error(`No certificates found in ${inputDir}`);

  // Phase 2: Efficient merkling to build hashmap
  const batchMerkleTree = new MerkleTree(individualCertificateHashes);

  // Phase 3: Add proofs to signedCertificates
  const batchMerkleRoot = await appendProofToCerts(
    intermediateDir,
    outputDir,
    batchMerkleTree,
    () => removeCallback()
  );

  // Remove intermediate dir
  removeCallback();

  return batchMerkleRoot;
};

module.exports = {
  digestCertificate,
  appendProofToCerts,
  batchIssue
};
