# Certificate CLI tool

## Setup

```bash
npm install
```

## Batching Certificates

This command process all certificates in the input directory and issue all of them in a single
batch. It will then add the signature to the individual certificates.

```bash
./index.js batch <PathToUnsignedCertificates> <PathToSignedCertificates>
```

Example:

```bash
./index.js batch ./certificates/raw-certificates/ ./certificates/processed-certificates/

2019-02-11T08:37:44.848Z info: Batch Certificate Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

## Verifying All Signed Certificate in a Directory

This command verifies that the certificate (and all it's evidence) is valid and is part of the certificate batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the certificate has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify-all <PathToCertificate>
```

Example:

```bash
./index.js verify-all ./certificates/processed-certificates

2019-02-11T08:38:36.767Z info: All certificates in ./certificates/processed-certificates is verified
```

## Verifying Single Signed Certificate

This command verifies that the certificate (and all it's evidence) is valid and is part of the certificate batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the certificate has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify <PathToCertificate>
```

Example:

```bash
./index.js verify ./certificates/processed-certificates/urn:uuid:08b1f10a-6bf0-46c8-bbfd-64750b0d73ef.json

2019-02-11T08:41:17.301Z info: Certificate's signature is valid!
2019-02-11T08:41:17.302Z warn: Warning: Please verify this certificate on the blockchain with the issuer's certificate store.
```

## Certificate privacy filter

This allows certificate holders to generate valid certificates which hides certain evidences. Useful for hiding grades lol.

```bash
./index.js filter <inputCertificatePath> <outputCertificatePath> [filters...]
```

Example:

```bash
./index.js filter ./certificates/processed-certificates/urn\:uuid\:060b3c1b-0689-4558-b946-862963641eba.json ./certificates/processed-certificates/urn\:uuid\:060b3c1b-0689-4558-b946-862963641eba.out.json transcript.0.grade transcript.1.grade transcript.2.grade

============================== Filtered Certificate ==============================

{
  "id": "urn:uuid:060b3c1b-0689-4558-b946-862963641eba",
  "type": "Assertion",
  "issuedOn": "2018-02-19T09:12:20.051Z",
  "@context": [
    "https://openbadgespec.org/v2/context.json",
    "https://govtechsg.github.io/certificate-schema/schema/1.0/context.json"
  ],
  "badge": {
    "name": "pibbwa4x2x7fo0a68v18dr4bn",
    "criteria": "1woyqebh30rpkvrnps7j0h8m8tnun0zmmlo46f1d5eo2ctc962g61pmaq1nu7ayxp24nudlwn7x1277r",
    "issuer": {
      "id": "urn:uuid:599fd698-5095-4e4b-8469-ea30a994b420",
      "url": "http://jeffry.name",
      "email": "Karl.Rempel@gmail.com"
    },
    "type": "BadgeClass",
    "evidencePrivacyFilter": {
      "type": "SaltedProof",
      "saltLength": "10"
    },
    "evidence": {
      "transcript": [
        {
          "name": "rxavnnnqwx:d6whoa8c2bryr6w",
          "courseCode": "58ezfx0pgl:1f79g",
          "courseCredit": "8j3qiv8smt:447"
        },
        {
          "name": "3vvhp01ayb:qnk3zhkldkyqa0e",
          "courseCode": "j5xnkor9n6:3hmlm",
          "courseCredit": "xgcqoui543:bsx"
        },
        {
          "name": "e54t99btvq:ogp6zzbb21en9kb",
          "courseCode": "nuj4oj52ow:y9j6j",
          "courseCredit": "jofurno8f6:3pf"
        }
      ]
    },
    "privateEvidence": [
      "17359b28df891116c1c5dbe610f60fb647f0977e803f16b9142c6bda3d0a4b9d",
      "f7261d891a828f8f6dcf5c0455d0dd69700f0e1c6ac7d752d9c39a26d57d33ab",
      "b5db6261eac1c096f3dbc5ecae00262625fad91a6387379d113d74619481bcfc"
    ]
  },
  "verification": {
    "type": "ETHStoreProof",
    "contractAddress": "0x0"
  },
  "profile": [
    {
      "type": "email",
      "identity": "Collin.Dach@hotmail.com",
      "hashed": false
    },
    {
      "type": "did",
      "identity": "sha256$471ef07fbe24fb98520ee75a14581154b19bd62f2b9e1a42fded71fc9183b8be",
      "salt": "2e6sb2v56c",
      "hashed": true
    },
    {
      "type": "url",
      "identity": "sha256$2f4ddbfae9af670d9e4792c8b02484151a1d47a59ef71861131bb098dea9fb8a",
      "salt": "k25y6u7ewh",
      "hashed": true
    }
  ],
  "signature": {
    "type": "SHA3MerkleProof",
    "targetHash": "5550fbc3fa29ff4def2ac59b09e827cce80e937c1489a39096215b8564ac6313",
    "proof": [
      "598e8ca0a2763be8227a0be2ea2441616cc36602db7c8d55e9e69589cf5b3739",
      "71f8b42b995465067d4953bed91f936a3e8a11d6007d0b2aae9ae1193c696d71",
      "0b9d1ef301795d9ce61d06057b6e5afeeb3470aa562a54eae772338a47d8c29d",
      "b25717b934a5aaba8c589b502ee26a5a25d6c246b5be89f8a789c56ac919cbc3",
      "7f817789145683a2652dd5956d21098ba159d0243a77af99f4d793e9376615e0",
      "77f61d9e9f571718745e8120fdddf42dfe48e0b6f366e56d82068395277793ab"
    ],
    "merkleRoot": "64fda71b939cb33d4e437f832b64f24b772e192f60b7ecd60af2ab9173a03aef"
  }
}

===================================================================================
```

## Test

```
npm run test
```
