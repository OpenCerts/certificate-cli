const crypto = require("./crypto");

describe("crypto", () => {
  describe("bufSortJoin", () => {
    it("should work", () => {
      const res = crypto.bufSortJoin(
        Buffer.from("c"),
        Buffer.from("b"),
        Buffer.from("a")
      );
      const expectedResults = "616263";
      expect(res.hexSlice()).to.deep.equal(expectedResults);
    });
  });

  describe("hashToBuffer", () => {
    it("should work", () => {
      expect(crypto.hashToBuffer("foo")).to.deep.equal(
        Buffer.from("foo", "hex")
      );
    });

    it("should do nothing if the input is a hash", () => {
      const originalBuffer = Buffer.from("foo", "utf8");
      expect(crypto.hashToBuffer(originalBuffer)).to.deep.equal(originalBuffer);
    });
  });

  describe("combinedhash", () => {
    it("join two hashes in deterministic order", () => {
      const h1 = Buffer.from("a1", "hex");
      const h2 = Buffer.from("a2", "hex");
      const h12 = crypto.combinedHash(h1, h2);
      const h21 = crypto.combinedHash(h2, h1);

      expect(h12.toString("hex")).to.eql(
        "e95ec1a8fd9150296b7b972879f2b15d636fded6d2f2a5bc68784945eab5bd2f"
      );
      expect(h21.toString("hex")).to.eql(
        "e95ec1a8fd9150296b7b972879f2b15d636fded6d2f2a5bc68784945eab5bd2f"
      );
    });

    it("returns input if only one is provided", () => {
      const h1 = Buffer.from(
        "e95ec1a8fd9150296b7b972879f2b15d636fded6d2f2a5bc68784945eab5bd2f",
        "hex"
      );
      const h1x = crypto.combinedHash(h1);
      const hx1 = crypto.combinedHash(null, h1);

      expect(h1x.toString("hex")).to.eql(
        "e95ec1a8fd9150296b7b972879f2b15d636fded6d2f2a5bc68784945eab5bd2f"
      );
      expect(hx1.toString("hex")).to.eql(
        "e95ec1a8fd9150296b7b972879f2b15d636fded6d2f2a5bc68784945eab5bd2f"
      );
    });
  });
});
