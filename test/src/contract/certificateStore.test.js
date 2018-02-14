const Web3Mock = require("../../utils/mockWeb3");
const proxyquire = require("proxyquire");

const CertificateStore = proxyquire("../../../src/contract/certificateStore", {
  web3: Web3Mock
});

const address0 = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
const address1 = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";
const address2 = "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef";

const certificate0 = "0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE";
const certificate1 = "0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc";

describe.only("certificateStore", () => {
  describe("name", () => {
    it("should return name from contract", () => {
      const store = new CertificateStore(address0, address1);
      const name = "GovTech DLT";

      store.contract.addMethod("name");
      store.contract.methods.name().setResult(true, name);

      return store.name().should.eventually.deep.equal(name);
    });
  });

  describe("verificationUrl", () => {
    it("should return verificationUrl from contract", () => {
      const store = new CertificateStore(address0, address1);
      const verificationUrl = "https://tech.gov.sg";

      store.contract.addMethod("verificationUrl");
      store.contract.methods.verificationUrl().setResult(true, verificationUrl);

      return store
        .verificationUrl()
        .should.eventually.deep.equal(verificationUrl);
    });
  });

  describe("owner", () => {
    it("should return owner from contract", () => {
      const store = new CertificateStore(address0, address1);
      const owner = address0;

      store.contract.addMethod("owner");
      store.contract.methods.owner().setResult(true, owner);

      return store.owner().should.eventually.deep.equal(owner);
    });
  });

  describe("getIssuedBlock", () => {
    it("should return issued block no from contract", () => {
      const store = new CertificateStore(address0, address1);
      const issuedBlockNo = 15;

      store.contract.addMethod("getIssuedBlock");
      store.contract.methods.getIssuedBlock().setResult(true, issuedBlockNo);
      store.contract.methods.getIssuedBlock().expectParams(certificate0);

      return store.contract.methods
        .getIssuedBlock(certificate0)
        .call()
        .should.eventually.deep.equal(issuedBlockNo);
    });
  });
});
