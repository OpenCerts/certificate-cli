Canonicalisation / JSON Flattening

Blockcerts uses the jsonld [RDF canonicalization algorithm](http://json-ld.github.io/normalization/spec/index.html), whereas we use a [simple json flattening](https://www.npmjs.com/package/flat)

```JSON
{
  propertyA: {
    childB: "example string",
    childC: "example string 2",
    nestedChildD: {
      childE: "example string 3",
      childF: 2555
    }
  },
  propertyB: "example string 4"
}

```

becomes

```JSON
{ 'propertyA.childB': 'example string',
  'propertyA.childC': 'example string 2',
  'propertyA.nestedChildD.childE': 'example string 3',
  'propertyA.nestedChildD.childF': 2555,
   propertyB: 'example string 4' }
```