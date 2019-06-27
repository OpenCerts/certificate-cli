#!/usr/bin/env node
const fs = require("fs");
const mkdirp = require("mkdirp");
const yargs = require("yargs");
const {
  validateSchema,
  verifySignature,
  obfuscateFields
} = require("@govtechsg/tradetrust-schema");
const batchVerify = require("./src/batchVerify");
const { batchIssue } = require("./src/batchIssue");
const { logger, addConsole } = require("./lib/logger");
const { version } = require("./package.json");

// Pass argv with $1 and $2 sliced
const parseArguments = argv =>
  yargs
    .version(version)
    .usage("Tradetrust document issuing, verification and revocation tool.")
    .strict()
    .epilogue(
      "The common subcommands you might be interested in are:\n" +
        "- batch\n" +
        "- verify\n" +
        "- verify-all\n" +
        "- filter"
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
      command: "filter <source> <destination> [fields..]",
      description: "Obfuscate fields in the document",
      builder: sub =>
        sub
          .positional("source", {
            description: "Source signed document filename",
            normalize: true
          })
          .positional("destination", {
            description: "Destination to write obfuscated document file to",
            normalize: true
          })
    })
    .command({
      command: "verify [options] <file>",
      description: "Verify the document",
      builder: sub =>
        sub.positional("file", {
          description: "Document file to verify",
          normalize: true
        })
    })
    .command({
      command: "verify-all [options] <dir>",
      description: "Verify all certiifcate in a directory",
      builder: sub =>
        sub.positional("dir", {
          description: "Directory with all documents to verify",
          normalize: true
        })
    })
    .command({
      command: "batch [options] <raw-dir> <batched-dir>",
      description:
        "Combine a directory of documents into a document batch",
      builder: sub =>
        sub
          .positional("raw-dir", {
            description:
              "Directory containing the raw unissued and unsigned documents",
            normalize: true
          })
          .positional("batched-dir", {
            description: "Directory to output the batched documents to.",
            normalize: true
          })
    })
    .parse(argv);

const batch = async (raw, batched) => {
  mkdirp.sync(batched);
  return batchIssue(raw, batched)
    .then(merkleRoot => {
      logger.info(`Batch Document Root: 0x${merkleRoot}`);
      return `${merkleRoot}`;
    })
    .catch(err => {
      logger.error(err);
    });
};

const verifyAll = async dir => {
  const verified = await batchVerify(dir);
  if (verified) {
    logger.info(`All documents in ${dir} is verified`);
  } else {
    logger.error("At least one document failed verification");
  }
};

const verify = file => {
  const documentJson = JSON.parse(fs.readFileSync(file, "utf8"));
  if (verifySignature(documentJson) && validateSchema(documentJson)) {
    logger.info("Document's signature is valid!");
    logger.warn(
      "Warning: Please verify this document on the blockchain with the issuer's document store."
    );
  } else {
    logger.error("Document's signature is invalid");
  }

  return true;
};

const obfuscate = (input, output, fields) => {
  const documentJson = JSON.parse(fs.readFileSync(input, "utf8"));
  const obfuscatedDocument = obfuscateFields(documentJson, fields);
  const isValid =
    verifySignature(obfuscatedDocument) &&
    validateSchema(obfuscatedDocument);

  if (!isValid) {
    logger.error(
      "Privacy filtering caused document to fail schema or signature validation"
    );
  } else {
    fs.writeFileSync(output, JSON.stringify(obfuscatedDocument, null, 2));
    logger.info(`Obfuscated document saved to: ${output}`);
  }
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
    case "verify-all":
      return verifyAll(args.dir);
    case "filter":
      return obfuscate(args.source, args.destination, args.fields);
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
