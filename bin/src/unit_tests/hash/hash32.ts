import { test } from "../../unit/unit";
import { Adler32, CRC32 } from "ejs/hash";
import { encodeToString, decode, decodedLen } from "ejs/encoding/hex";
const m = test.module("ejs/hash")
interface adler32Test {
    out: number
    in: string | Uint8Array
}
function makeAdler32(out: number, val: number | string, repeat: number, str: string): adler32Test {
    if (typeof val === "number") {
        const s = new TextEncoder().encode(str)
        const dst = new Uint8Array(repeat + s.length)
        let i = 0
        for (; i < repeat; i++) {
            dst[i] = val
        }
        for (let j = 0; j < s.length; j++) {
            dst[i++] = s[j]
        }
        return {
            out: out,
            in: dst,
        }
    } else {
        return {
            out: out,
            in: val.repeat(repeat),
        }
    }
}
m.test("Adler32", (assert) => {
    const tests: Array<adler32Test> = [
        { out: 1, in: "" },
        { out: 6422626, in: "a" },
        { out: 19267780, in: "ab" },
        { out: 38600999, in: "abc" },
        { out: 64487819, in: "abcd" },
        { out: 96993776, in: "abcde" },
        { out: 136184406, in: "abcdef" },
        { out: 182125245, in: "abcdefg" },
        { out: 234881829, in: "abcdefgh" },
        { out: 294519694, in: "abcdefghi" },
        { out: 361104376, in: "abcdefghij" },
        { out: 1057558274, in: "Discard medicine more than two years old." },
        { out: 1188566135, in: "He who has a shady past knows that nice guys finish last." },
        { out: 1089343201, in: "I wouldn't marry him with a ten foot pole." },
        { out: 375788309, in: "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave" },
        { out: 1529746560, in: "The days of the digital watch are numbered.  -Tom Stoppard" },
        { out: 2352744938, in: "Nepal premier won't resign." },
        { out: 1168906493, in: "For every action there is an equal and opposite government program." },
        { out: 1405490274, in: "His money is twice tainted: 'taint yours and 'taint mine." },
        { out: 2119245411, in: "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977" },
        { out: 3833600618, in: "It's a tiny change to the code and not completely disgusting. - Bob Manchek" },
        { out: 1639253983, in: "size:  a.out:  bad magic" },
        { out: 3093500273, in: "The major problem is with sendmail.  -Mark Horton" },
        { out: 2338199812, in: "Give me a rock, paper and scissors and I will move the world.  CCFestoon" },
        { out: 2093355051, in: "If the enemy is within range, then so are you." },
        { out: 1879251175, in: "It's well we cannot hear the screams/That we create in others' dreams." },
        { out: 509613895, in: "You remind me of a TV show, but that's all right: I watch it anyway." },
        { out: 3042642697, in: "C is as portable as Stonehedge!!" },
        { out: 957423056, in: "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley" },
        { out: 2447192143, in: "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule" },
        { out: 777851670, in: "How can you write a big system without C++?  -Paul Glick" },
        { out: 3491765750, in: "'Invariant assertions' is the most elegant programming technique!  -Tom Szymanski" },
        makeAdler32(0x211297c8, 0xff, 5548, "8"),
        makeAdler32(0xbaa198c8, 0xff, 5549, "9"),
        makeAdler32(0x553499be, 0xff, 5550, "0"),
        makeAdler32(0xf0c19abe, 0xff, 5551, "1"),
        makeAdler32(0x8d5c9bbe, 0xff, 5552, "2"),
        makeAdler32(0x2af69cbe, 0xff, 5553, "3"),
        makeAdler32(0xc9809dbe, 0xff, 5554, "4"),
        makeAdler32(0x69189ebe, 0xff, 5555, "5"),
        makeAdler32(0x86af0001, 0x00, 1e5, ""),
        makeAdler32(0x79660b4d, "a", 1e5, ""),
        makeAdler32(0x110588ee, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1e4, ""),
    ]
    const H = Adler32
    assert.equal(4, H.blocksize, 'blocksize')
    assert.equal(4, H.hashsize, 'hashsize')

    const dst = new Uint8Array(H.hashsize)
    const hash = new Adler32()
    const name = "Adler32"
    for (const t of tests) {
        assert.equal(t.out, H.sum32(t.in), `sum32 ${t.in}`)
        let out = encodeToString(H.sum(t.in))

        assert.equal(dst.length, H.sumTo(dst, t.in), `sumTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `sumTo ${t.in}`)

        assert.equal(t.out, hash.sum32(t.in), `$${name} sum32 ${t.in}`)
        out = encodeToString(hash.sum(t.in))
        assert.equal(dst.length, hash.sumTo(dst, t.in), `${name} sumTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `${name} sumTo ${t.in}`)

        assert.equal(out, encodeToString(hash.done(t.in)), `${name} done ${t.in}`)
        hash.reset()

        assert.equal(dst.length, hash.doneTo(dst, t.in), `${name} doneTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `${name} doneTo ${t.in}`)
        hash.reset()

        const b = typeof t.in === "string" ? new TextEncoder().encode(t.in) : t.in
        if (b.length > 0) {
            hash.write(b.subarray(0, 1))
            const data = b.subarray(1)
            assert.equal(out, encodeToString(hash.sum(data)), `${name} write.sum ${t.in}`)
            assert.equal(dst.length, hash.sumTo(dst, data), `${name} write.sumTo ${t.in}`)
            assert.equal(out, encodeToString(dst), `${name} write.sumTo ${t.in}`)

            const h = hash.clone()
            assert.equal(out, encodeToString(h.done(data)), `${name} write.done ${t.in}`)

            assert.equal(dst.length, hash.doneTo(dst, data), `${name} write.doneTo ${t.in}`)
            assert.equal(out, encodeToString(dst), `${name} write.doneTo ${t.in}`)
            hash.reset()
        }
    }
})


m.test("CRC32", (assert) => {
    function make(out: number, h: string) {
        const buf = new Uint8Array(decodedLen(h))
        decode(buf, h)
        return {
            out: out,
            in: buf,
        }
    }
    const tests = [
        make(0, ""),
        make(3904355907, "61"),
        make(2659403885, "6162"),
        make(891568578, "616263"),
        make(3984772369, "61626364"),
        make(2240272485, "6162636465"),
        make(1267612143, "616263646566"),
        make(824863398, "61626364656667"),
        make(2934909520, "6162636465666768"),
        make(2376698031, "616263646566676869"),
        make(964784186, "6162636465666768696a"),
        make(1805443047, "44697363617264206d65646963696e65206d6f7265207468616e2074776f207965617273206f6c642e"),
        make(3373201215, "48652077686f2068617320612073686164792070617374206b6e6f77732074686174206e69636520677579732066696e697368206c6173742e"),
        make(3103929375, "4920776f756c646e2774206d617272792068696d207769746820612074656e20666f6f7420706f6c652e"),
        make(69239016, "46726565212046726565212f4120747269702f746f204d6172732f666f72203930302f656d707479206a6172732f4275726d61205368617665"),
        make(357330193, "5468652064617973206f6620746865206469676974616c20776174636820617265206e756d62657265642e20202d546f6d2053746f7070617264"),
        make(1279361829, "4e6570616c207072656d69657220776f6e27742072657369676e2e"),
        make(865423696, "466f7220657665727920616374696f6e20746865726520697320616e20657175616c20616e64206f70706f7369746520676f7665726e6d656e742070726f6772616d2e"),
        make(639724107, "486973206d6f6e6579206973207477696365207461696e7465643a20277461696e7420796f75727320616e6420277461696e74206d696e652e"),
        make(448521310, "5468657265206973206e6f20726561736f6e20666f7220616e7920696e646976696475616c20746f2068617665206120636f6d707574657220696e20746865697220686f6d652e202d4b656e204f6c73656e2c2031393737"),
        make(3365573879, "4974277320612074696e79206368616e676520746f2074686520636f646520616e64206e6f7420636f6d706c6574656c792064697367757374696e672e202d20426f62204d616e6368656b"),
        make(2872753684, "73697a653a2020612e6f75743a2020626164206d61676963"),
        make(3132162742, "546865206d616a6f722070726f626c656d20697320776974682073656e646d61696c2e20202d4d61726b20486f72746f6e"),
        make(2576435671, "47697665206d65206120726f636b2c20706170657220616e642073636973736f727320616e6420492077696c6c206d6f76652074686520776f726c642e20204343466573746f6f6e"),
        make(1834132284, "49662074686520656e656d792069732077697468696e2072616e67652c207468656e20736f2061726520796f752e"),
        make(2422414989, "497427732077656c6c2077652063616e6e6f742068656172207468652073637265616d732f546861742077652063726561746520696e206f74686572732720647265616d732e"),
        make(2016448816, "596f752072656d696e64206d65206f6620612054562073686f772c206275742074686174277320616c6c2072696768743a204920776174636820697420616e797761792e"),
        make(2097821567, "4320697320617320706f727461626c652061732053746f6e6568656467652121"),
        make(2356804985, "4576656e206966204920636f756c64206265205368616b657370656172652c2049207468696e6b20492073686f756c64207374696c6c2063686f6f736520746f20626520466172616461792e202d20412e204875786c6579"),
        make(2718658919, "546865206675676163697479206f66206120636f6e7374697475656e7420696e2061206d697874757265206f66206761736573206174206120676976656e2074656d70657261747572652069732070726f706f7274696f6e616c20746f20697473206d6f6c65206672616374696f6e2e20204c657769732d52616e64616c6c2052756c65"),
        make(2383131715, "486f772063616e20796f752077726974652061206269672073797374656d20776974686f757420432b2b3f20202d5061756c20476c69636b"),
    ]
    const H = CRC32
    assert.equal(1, H.blocksize, 'blocksize')
    assert.equal(4, H.hashsize, 'hashsize')

    const dst = new Uint8Array(H.hashsize)
    const hash = new CRC32()
    const name = "CRC32"
    for (const t of tests) {
        assert.equal(t.out, H.sum32(t.in), `sum32 ${t.in}`)
        let out = encodeToString(H.sum(t.in))

        assert.equal(dst.length, H.sumTo(dst, t.in), `sumTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `sumTo ${t.in}`)

        assert.equal(t.out, hash.sum32(t.in), `$${name} sum32 ${t.in}`)
        out = encodeToString(hash.sum(t.in))
        assert.equal(dst.length, hash.sumTo(dst, t.in), `${name} sumTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `${name} sumTo ${t.in}`)

        assert.equal(out, encodeToString(hash.done(t.in)), `${name} done ${t.in}`)
        hash.reset()

        assert.equal(dst.length, hash.doneTo(dst, t.in), `${name} doneTo ${t.in}`)
        assert.equal(out, encodeToString(dst), `${name} doneTo ${t.in}`)
        hash.reset()

        const b = t.in
        if (b.length > 0) {
            hash.write(b.subarray(0, 1))
            const data = b.subarray(1)
            assert.equal(out, encodeToString(hash.sum(data)), `${name} write.sum ${t.in}`)
            assert.equal(dst.length, hash.sumTo(dst, data), `${name} write.sumTo ${t.in}`)
            assert.equal(out, encodeToString(dst), `${name} write.sumTo ${t.in}`)

            const h = hash.clone()
            assert.equal(out, encodeToString(h.done(data)), `${name} write.done ${t.in}`)

            assert.equal(dst.length, hash.doneTo(dst, data), `${name} write.doneTo ${t.in}`)
            assert.equal(out, encodeToString(dst), `${name} write.doneTo ${t.in}`)
            hash.reset()
        }
    }
})