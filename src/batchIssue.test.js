const {
  digestCertificate,
  appendProofToCerts,
  merkleHashmap,
  batchIssue
} = require("./batchIssue");

/*
describe("Test Cert", () => {
  it("works", () => {
    const cert = require("../load/signed/cert1.json");
    console.log(verifySignature(cert));
    console.log(validateSchema(cert));
  });
});
*/

describe("Test", () => {
  it("works", async () => {
    const CERTIFICATES = "./load/unsigned/";
    const CERTIFICATES_SIGNED = "./load/signed/";
    await batchIssue(CERTIFICATES, CERTIFICATES_SIGNED);
  }).timeout(200000000);
});
