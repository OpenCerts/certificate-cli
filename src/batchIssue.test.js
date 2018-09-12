const proxyquire = require("proxyquire");
const jsf = require("json-schema-faker");
const { schemas } = require("@govtechsg/open-certificate");
const { map, range, get } = require("lodash");

let certs = [];
const filenameMap = {};
const signedCerts = [];

const getCertsStub = async function() {
  return { filenameMap, certificates: certs };
};

const writeCertsStub = function(outputDir, signedCertFilename, certificate) {
  signedCerts.push(certificate);
};

const batchIssue = proxyquire("./batchIssue", {
  "./diskUtils": {
    getRawCertificates: getCertsStub,
    writeCertToDisk: writeCertsStub
  }
});

function makeCerts(count) {
  const schema = schemas["1.3"];
  return Promise.all(range(0, count).map(() => jsf.resolve(schema)));
}

async function whenThereAreDuplicateCertificateIDs() {
  const withDuplicateCertIDs = await makeCerts(10);
  withDuplicateCertIDs[0].id = "abc123";
  withDuplicateCertIDs[1].id = "abc123";

  certs = withDuplicateCertIDs;
}

describe("src/batchIssue", () => {
  before(async () => {
    certs = await makeCerts(10);
  });

  it("should generate signatures for all the input certs", async () => {
    const merkleRoot = await batchIssue("mew", "mew2");
    expect(merkleRoot.length).to.be.equal(64);
    map(signedCerts, cert => {
      expect(get(cert, "signature.merkleRoot")).to.be.deep.equal(merkleRoot);
    });
  });

  it("shoud throw an error if there are duplicate certificate IDs", async () => {
    await whenThereAreDuplicateCertificateIDs();

    return expect(batchIssue("mew", "mew2")).to.be.rejectedWith(
      "There were duplicate document IDs found in the certificates, please ensure that the IDs are unique"
    );
  });
});
