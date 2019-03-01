const proxyquire = require("proxyquire");
const { hashToBuffer: tb } = require("./crypto");
const sinon = require("sinon");
const sampleUndigestedCert = require("../test/fixtures/undigestedCerts/example.0.json");
const { BatchMerkleTree } = require("./batchIssue");

const readCert = sinon.stub();
const writeCertToDisk = sinon.stub();
const certificatesInDirectory = sinon.stub();
const { digestCertificate, appendProofToCerts, merkleHashmap } = proxyquire(
  "./batchIssue",
  {
    "./diskUtils": {
      readCert,
      writeCertToDisk,
      certificatesInDirectory
    }
  }
);

describe("batchIssue", () => {
  beforeEach(() => {
    readCert.reset();
    writeCertToDisk.reset();
    certificatesInDirectory.reset();
  });

  describe("appendProofToCerts", () => {
    it("determines the proof for each cert using the hashmap and writes the new cert back", async () => {
      const hashMap = {
        a: { w: "b", n: "d" },
        b: { w: "a", n: "d" },
        c: { w: "d", n: "e" },
        d: { w: "c", n: "e" }
      };
      certificatesInDirectory.returns([
        "file_1.json",
        "file_2.json",
        "file_3.json"
      ]);
      readCert.onCall(0).returns({
        signature: {
          targetHash: "a"
        }
      });
      readCert.onCall(1).returns({
        signature: {
          targetHash: "b"
        }
      });
      readCert.onCall(2).returns({
        signature: {
          targetHash: "c"
        }
      });

      const root = await appendProofToCerts("DIR", "DIR", hashMap);

      expect(root).to.be.eql("e");

      expect(writeCertToDisk.args[0]).to.eql([
        "DIR",
        "file_1.json",
        {
          signature: {
            targetHash: "a",
            proof: ["b", "c"],
            merkleRoot: "e"
          }
        }
      ]);
      expect(writeCertToDisk.args[1]).to.eql([
        "DIR",
        "file_2.json",
        {
          signature: {
            targetHash: "b",
            proof: ["a", "c"],
            merkleRoot: "e"
          }
        }
      ]);
      expect(writeCertToDisk.args[2]).to.eql([
        "DIR",
        "file_3.json",
        {
          signature: {
            targetHash: "c",
            proof: ["d"],
            merkleRoot: "e"
          }
        }
      ]);
    });
  });

  describe("digestCertificate", () => {
    it("digest all certificates, writes the digested certs to output_dir and returns array of all hashes", async () => {
      certificatesInDirectory.returns([
        "file_1.json",
        "file_2.json",
        "file_3.json"
      ]);
      readCert.returns(sampleUndigestedCert);
      const hashArray = await digestCertificate("input_dir", "output_dir");

      expect(hashArray.length).to.be.eql(3);

      expect(writeCertToDisk.args[0][0]).to.be.eql("output_dir");
      expect(writeCertToDisk.args[1][0]).to.be.eql("output_dir");
      expect(writeCertToDisk.args[2][0]).to.be.eql("output_dir");
      expect(writeCertToDisk.args[0][1]).to.be.eql("file_1.json");
      expect(writeCertToDisk.args[1][1]).to.be.eql("file_2.json");
      expect(writeCertToDisk.args[2][1]).to.be.eql("file_3.json");

      expect(writeCertToDisk.args[0][2].signature.merkleRoot).to.be.eql(
        hashArray[0].toString("hex")
      );
      expect(writeCertToDisk.args[1][2].signature.merkleRoot).to.be.eql(
        hashArray[1].toString("hex")
      );
      expect(writeCertToDisk.args[2][2].signature.merkleRoot).to.be.eql(
        hashArray[2].toString("hex")
      );
    });
  });

  const h1 = "41b1a0649752af1b28b3dc29a1556eee781e4a4c3a1f7f53f90fa834de098c4d";
  const h2 = "435cd288e3694b535549c3af56ad805c149f92961bf84a1c647f7d86fc2431b4";
  const h12 =
    "744766909640c85c19ca00139e7af3c5d9cb8dbfbc6635812eedc4e3cbf4fce6";

  describe("merkleHashmap", () => {
    it("returns empty object for one hash (root)", () => {
      const hmap = merkleHashmap([tb(h1)]);
      expect(hmap).to.deep.equal({});
    });
    it("returns hashmap for two hashes", () => {
      const hmap = merkleHashmap([tb(h1), tb(h2)]);
      expect(hmap).to.deep.equal({
        [h1]: { w: h2, n: h12 },
        [h2]: { w: h1, n: h12 }
      });
    });
    it("returns hashmap for odd number (5) hashes", () => {
      const hashArray = [
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
        "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
        "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
        "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761"
      ];
      const hashArrayBuf = hashArray.map(tb);
      const hmap = merkleHashmap(hashArrayBuf);
      const expectedHmap = {
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb": {
          w: "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
          n: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8"
        },
        b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510: {
          w: "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
          n: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8"
        },
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2": {
          w: "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
          n: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669"
        },
        f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3: {
          w: "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
          n: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669"
        },
        "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8": {
          w: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669",
          n: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf"
        },
        d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669: {
          w: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8",
          n: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf"
        },
        "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf": {
          w: "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761",
          n: "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d"
        },
        a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761: {
          w: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf",
          n: "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d"
        }
      };

      expect(hmap).to.deep.equal(expectedHmap);
    });
  });

  describe("BatchMerkleTree", () => {
    it.only("should work", () => {
      const hashArray = [
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
        "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
        "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
        "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761"
      ];
      const hashArrayBuf = hashArray.map(tb);
      const hmap = merkleHashmap(hashArrayBuf);
      const tree = new BatchMerkleTree(hashArrayBuf);
      const expectedHmap = {
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb": {
          sibling:
            "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
          parent:
            "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8"
        },
        b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510: {
          sibling:
            "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
          parent:
            "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8"
        },
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2": {
          sibling:
            "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
          parent:
            "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669"
        },
        f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3: {
          sibling:
            "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
          parent:
            "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669"
        },
        "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8": {
          sibling:
            "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669",
          parent:
            "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf"
        },
        d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669: {
          sibling:
            "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8",
          parent:
            "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf"
        },
        "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf": {
          sibling:
            "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761",
          parent:
            "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d"
        },
        a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761: {
          sibling:
            "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf",
          parent:
            "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d"
        }
      };
      hashArray.forEach(element => {
        expect(tree.getSibling(element)).to.equal(
          expectedHmap[element].sibling
        );
        expect(tree.getParent(element)).to.equal(expectedHmap[element].parent);
      });
      expect(
        tree.getSibling(
          "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb"
        )
      ).to.deep.equal(
        "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510"
      );

      console.log(tree.hashMap);
    });
  });
});
