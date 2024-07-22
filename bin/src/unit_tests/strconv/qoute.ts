import { test } from "../../unit/unit";
import * as strconv from "ejs/strconv";
import * as hex from "ejs/encoding/hex";
const m = test.module("ejs/strconv")
const quotetests = [
    { "in": "07080c0d0a090b", "out": "225c615c625c665c725c6e5c745c7622", "ascii": "225c615c625c665c725c6e5c745c7622", "graphic": "225c615c625c665c725c6e5c745c7622" },
    { "in": "5c", "out": "225c5c22", "ascii": "225c5c22", "graphic": "225c5c22" },
    { "in": "616263ff646566", "out": "226162635c78666664656622", "ascii": "226162635c78666664656622", "graphic": "226162635c78666664656622" },
    { "in": "e298ba", "out": "22e298ba22", "ascii": "225c753236336122", "graphic": "22e298ba22" },
    { "in": "f48fbfbf", "out": "225c55303031306666666622", "ascii": "225c55303031306666666622", "graphic": "225c55303031306666666622" },
    { "in": "04", "out": "225c78303422", "ascii": "225c78303422", "graphic": "225c78303422" },
    { "in": "21c2a021e2808021e3808021", "out": "22215c7530306130215c7532303030215c75333030302122", "ascii": "22215c7530306130215c7532303030215c75333030302122", "graphic": "2221c2a021e2808021e380802122" },
    { "in": "7f", "out": "225c78376622", "ascii": "225c78376622", "graphic": "225c78376622" },
]

m.test("Quote", (assert) => {
    for (const test of quotetests) {
        const out = strconv.quote(hex.decode(test.in))
        assert.equal(test.out, hex.encodeToString(out), test)

        let builder = new strconv.StringBuilder()
        builder.appendQuote(hex.decode(test.in))
        assert.equal(test.out, hex.encodeToString(builder.toBuffer()!), test)

        const buf = new TextEncoder().encode("abc")
        builder = new strconv.StringBuilder(buf, buf.length)
        builder.appendQuote(hex.decode(test.in))
        assert.equal(buf, builder.toBuffer()!.subarray(0, buf.length), test)

        assert.equal(test.out, hex.encodeToString(builder.toBuffer()!.subarray(buf.length)), test)
    }
})
m.test("QuoteToASCII", (assert) => {
    for (const test of quotetests) {
        const out = strconv.quoteToASCII(hex.decode(test.in))
        assert.equal(test.ascii, hex.encodeToString(out), test)

        let builder = new strconv.StringBuilder()
        builder.appendQuoteToASCII(hex.decode(test.in))
        assert.equal(test.ascii, hex.encodeToString(builder.toBuffer()!), test)

        const buf = new TextEncoder().encode("abc")
        builder = new strconv.StringBuilder(buf, buf.length)
        builder.appendQuoteToASCII(hex.decode(test.in))
        assert.equal(buf, builder.toBuffer()!.subarray(0, buf.length), test)

        assert.equal(test.ascii, hex.encodeToString(builder.toBuffer()!.subarray(buf.length)), test)
    }
})

m.test("QuoteToGraphic", (assert) => {
    for (const test of quotetests) {
        const out = strconv.quoteToGraphic(hex.decode(test.in))
        assert.equal(test.graphic, hex.encodeToString(out), test)

        let builder = new strconv.StringBuilder()
        builder.appendQuoteToGraphic(hex.decode(test.in))
        assert.equal(test.graphic, hex.encodeToString(builder.toBuffer()!), test)

        const buf = new TextEncoder().encode("abc")
        builder = new strconv.StringBuilder(buf, buf.length)
        builder.appendQuoteToGraphic(hex.decode(test.in))
        assert.equal(buf, builder.toBuffer()!.subarray(0, buf.length), test)

        assert.equal(test.graphic, hex.encodeToString(builder.toBuffer()!.subarray(buf.length)), test)
    }
})

const quoterunetests = [
    { "in": 97, "out": "276127", "ascii": "276127", "graphic": "276127" },
    { "in": 7, "out": "275c6127", "ascii": "275c6127", "graphic": "275c6127" },
    { "in": 92, "out": "275c5c27", "ascii": "275c5c27", "graphic": "275c5c27" },
    { "in": 255, "out": "27c3bf27", "ascii": "275c753030666627", "graphic": "27c3bf27" },
    { "in": 9786, "out": "27e298ba27", "ascii": "275c753236336127", "graphic": "27e298ba27" },
    { "in": 57005, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 65533, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 1114111, "out": "275c55303031306666666627", "ascii": "275c55303031306666666627", "graphic": "275c55303031306666666627" },
    { "in": 1114112, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 4, "out": "275c78303427", "ascii": "275c78303427", "graphic": "275c78303427" },
    { "in": 160, "out": "275c753030613027", "ascii": "275c753030613027", "graphic": "27c2a027" },
    { "in": 8192, "out": "275c753230303027", "ascii": "275c753230303027", "graphic": "27e2808027" },
    { "in": 12288, "out": "275c753330303027", "ascii": "275c753330303027", "graphic": "27e3808027" },
]
m.test("QuoteRune", (assert) => {
    for (const test of quoterunetests) {
        const out = strconv.quoteRune(test.in)
        assert.equal(test.out, hex.encodeToString(out), test)

        let builder = new strconv.StringBuilder()
        builder.appendQuoteRune(test.in)
        assert.equal(test.out, hex.encodeToString(builder.toBuffer()!), test)

        const buf = new TextEncoder().encode("abc")
        builder = new strconv.StringBuilder(buf, buf.length)
        builder.appendQuoteRune(test.in)
        assert.equal(buf, builder.toBuffer()!.subarray(0, buf.length), test)

        assert.equal(test.out, hex.encodeToString(builder.toBuffer()!.subarray(buf.length)), test)
    }
})