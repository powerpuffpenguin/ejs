import { test } from "../../unit/unit";
import * as strconv from "ejs/strconv";
const m = test.module("ejs/strconv")
const quotetests = [
    { "in": "\u0007\u0008\u000c\r\n\t\u000b", "out": "\"\\a\\b\\f\\r\\n\\t\\v\"", "ascii": "\"\\a\\b\\f\\r\\n\\t\\v\"", "graphic": "\"\\a\\b\\f\\r\\n\\t\\v\"" },
    { "in": "\\", "out": "\"\\\\\"", "ascii": "\"\\\\\"", "graphic": "\"\\\\\"" },
    { "in": "abc\ufffddef", "out": "\"abc\\xffdef\"", "ascii": "\"abc\\xffdef\"", "graphic": "\"abc\\xffdef\"" },
    { "in": "☺", "out": "\"☺\"", "ascii": "\"\\u263a\"", "graphic": "\"☺\"" },
    { "in": "􏿿", "out": "\"\\U0010ffff\"", "ascii": "\"\\U0010ffff\"", "graphic": "\"\\U0010ffff\"" },
    { "in": "\u0004", "out": "\"\\x04\"", "ascii": "\"\\x04\"", "graphic": "\"\\x04\"" },
    { "in": "! ! !　!", "out": "\"!\\u00a0!\\u2000!\\u3000!\"", "ascii": "\"!\\u00a0!\\u2000!\\u3000!\"", "graphic": "\"! ! !　!\"" },
    { "in": "", "out": "\"\\x7f\"", "ascii": "\"\\x7f\"", "graphic": "\"\\x7f\"" }
]

m.test("Quote", (assert) => {
    for (const test of quotetests) {
        assert.equal(test.out, strconv.quote(test.in), test)
    }
})