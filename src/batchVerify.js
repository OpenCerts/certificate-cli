const { readCert, certificatesInDirectory } = require("./diskUtils");
const {
  verifySignature,
  validateSchema
} = require("@govtechsg/open-certificate");
const { logger } = require("../lib/logger");

const batchVerify = async (undigestedCertDir, schemaVersion) => {
  const certFileNames = await certificatesInDirectory(undigestedCertDir);
  let allVerified = true;
  certFileNames.forEach(file => {
    const certificate = readCert(undigestedCertDir, file);
    const validSignature = verifySignature(certificate);
    const validSchema = validateSchema(certificate, schemaVersion);
    const isValid = validSchema && validSignature;
    allVerified = allVerified && isValid;
    if (isValid) {
      logger.debug(`${file}: Verified`);
    } else {
      logger.error(`${file}: ======= VERIFICATION FAILED =======`);
    }
  });
  return allVerified;
};

module.exports = batchVerify;
