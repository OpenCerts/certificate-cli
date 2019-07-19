const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { dirSync } = require("tmp");
const fs = require("fs");

const readdir = util.promisify(fs.readdir);

const testHash = hash => {
  const regex = /^0x[a-fA-F0-9]{64}$/;
  return regex.test(hash);
};

const runEndToEndOnSchemaVersion = async schemaVersion => {
  // Setup tmp directory to store batched certificates
  const { name: tmpDirName, removeCallback: tmpDirCleanup } = dirSync({
    unsafeCleanup: true
  });

  try {
    // Batching certificates return merkle root that looks correct
    const batchCmd = await exec(
      `node . batch ./test/fixtures/schema/${schemaVersion} ${tmpDirName} --schema ${schemaVersion}`
    );
    const outputHash = batchCmd.stdout.trim();
    expect(testHash(outputHash)).to.be.eql(true);
    expect(batchCmd.stderr).to.be.eql("");

    // Batched certificates can be verified
    const verifyAllCmd = await exec(
      `node . verify-all ${tmpDirName} --schema ${schemaVersion}`
    );
    expect(verifyAllCmd.stdout.trim()).to.be.eql("true");
    expect(verifyAllCmd.stderr).to.be.eql("");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    throw Error(`Failed at ${schemaVersion}`);
  }

  // Cleanup tmp dir
  tmpDirCleanup();
};

describe("[E2E] batch & verify-all", () => {
  it("batch and verify for all schema versions", async () => {
    const schemaVersions = await readdir("./test/fixtures/schema");
    const validationPromises = schemaVersions.map(runEndToEndOnSchemaVersion);
    await Promise.all(validationPromises);
  }).timeout(60000);
});
