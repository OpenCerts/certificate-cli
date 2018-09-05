const proxyquire = require("proxyquire");
const jsf = require("json-schema-faker");
const { schemas } = require("@govtechsg/open-certificate");
const { range } = require("lodash");

const readdirStub = function() {
  console.log("stub called");
  return ["asd", "asd2", "asd3"];
};
const batchIssue = proxyquire("./batchIssue", { fs: { readdir: readdirStub } });

let certs = [];

function makeCert(count) {
  const schema = schemas["1.3"];
  return Promise.all(range(0, count).map(() => jsf.resolve(schema)));
}

describe("src/batchIssue", () => {
  before(async () => {
    certs = await makeCert(10);
  });

  it("should", () => {
    console.log(certs);
    batchIssue("mew", "mew2");
    console.log("wtf");
  });
});
