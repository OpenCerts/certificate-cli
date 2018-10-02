#!/usr/bin/env node
const fs = require("fs");
const mkdirp = require("mkdirp");
const yargs = require("yargs");
const {
  validateSchema,
  verifySignature,
  obfuscateFields,
  schemas
} = require("@govtechsg/open-certificate");

const batchIssue = require("./src/batchIssue");
const { logger, addConsole } = require("./lib/logger");

// Pass argv with $1 and $2 sliced
const parseArguments = argv =>
  yargs
    .version("0.2.0")
    .usage("Certificate issuing, verification and revocation tool.")
    .strict()
    .epilogue(
      "The common subcommands you might be interested in are:\n" +
        "- issue\n" +
        "- verify\n" +
        "- revoke"
    )
    .options({
      "log-level": {
        choices: ["error", "warn", "info", "verbose", "debug", "silly"],
        default: "info",
        description: "Set the log level",
        global: true
      }
    })
    .command({
      command: "filter <input> <output> [fields..]",
      description: "Obfuscate fields in the certificate",
      builder: sub =>
        sub
          .positional("input", {
            description: "Certificate file to verify",
            normalize: true
          })
          .positional("output", {
            description: "Certificate file to verify",
            normalize: true
          })
    })
    .command({
      command: "verify [options] <file>",
      description: "Verify the certificate",
      builder: sub =>
        sub.positional("file", {
          description: "Certificate file to verify",
          normalize: true
        })
    })
    .command({
      command: "batch [options] <raw-dir> <batched-dir>",
      description:
        "Combine a directory of certificates into a certificate batch",
      builder: sub =>
        sub
          .positional("raw-dir", {
            description:
              "Directory containing the raw unissued and unsigned certificates",
            normalize: true
          })
          .positional("batched-dir", {
            description: "Directory to output the batched certificates to.",
            normalize: true
          })
    })
    .parse(argv);

const batch = async (raw, batched) => {
  mkdirp.sync(batched);
  return batchIssue(raw, batched)
    .then(merkleRoot => {
      logger.info(`Batch Certificate Root: ${merkleRoot}`);
      return `${merkleRoot}`;
    })
    .catch(err => {
      logger.error(err);
    });
};

const verify = file => {
  const certificateJson = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(verifySignature(certificateJson));
  console.log(validateSchema(certificateJson));
  if (verifySignature(certificateJson) && validateSchema(certificateJson)) {
    logger.info("Certificate's signature is valid!");
    logger.warn(
      "Warning: Please verify this certificate on the blockchain with the issuer's certificate store."
    );
  } else {
    logger.error("Certificate's signature is invalid");
  }

  return true;
};

const obfuscate = (input, output, fields) => {
  const certificateJson = JSON.parse(fs.readFileSync(input, "utf8"));
  const obfuscatedCertificate = obfuscateFields(certificateJson, fields);
  const test = JSON.parse(fs.readFileSync(output));
  console.log(JSON.stringify(test, null, 2));
  console.log("Validate:", verifySignature(test) && validateSchema(test));
  fs.writeFileSync(output, JSON.stringify(obfuscatedCertificate, null, 2));
  logger.info(`Obfuscated certificate saved to: ${output}`);
};

const main = async argv => {
  const args = parseArguments(argv);
  addConsole(args.logLevel);
  logger.debug(`Parsed args: ${JSON.stringify(args)}`);

  if (args._.length !== 1) {
    yargs.showHelp("log");
    return false;
  }
  switch (args._[0]) {
    case "batch":
      return batch(args.rawDir, args.batchedDir);
    case "verify":
      return verify(args.file);
    case "filter":
      return obfuscate(args.input, args.output, args.fields);
    default:
      throw new Error(`Unknown command ${args._[0]}. Possible bug.`);
  }
};

if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2))
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      logger.error(`Error executing: ${err}`);
      if (typeof err.stack !== "undefined") {
        logger.debug(err.stack);
      }
      logger.debug(JSON.stringify(err));
      process.exit(1);
    });
}
