import { Assert, test } from "../../unit/unit";
import { MD5 } from "ejs/hash";
import { encodeToString } from "ejs/encoding/hex";

const m = test.module("ejs/hash")
function make(out: string, input: string) {
    return {
        out: out,
        in: input,
    }
}

m.test("MD5", (assert) => {
    const tests = [
        make("d41d8cd98f00b204e9800998ecf8427e", ""),
        make("0cc175b9c0f1b6a831c399e269772661", "a"),
        make("187ef4436122d1cc2f40dc2b92f0eba0", "ab"),
        make("900150983cd24fb0d6963f7d28e17f72", "abc"),
        make("e2fc714c4727ee9395f324cd2e7f331f", "abcd"),
        make("ab56b4d92b40713acc5af89985d4b786", "abcde"),
        make("e80b5017098950fc58aad83c8c14978e", "abcdef"),
        make("7ac66c0f148de9519b8bd264312c4d64", "abcdefg"),
        make("e8dc4081b13434b45189a720b77b6818", "abcdefgh"),
        make("8aa99b1f439ff71293e95357bac6fd94", "abcdefghi"),
        make("a925576942e94b2ef57a066101b48876", "abcdefghij"),
        make("d747fc1719c7eacb84058196cfe56d57", "Discard medicine more than two years old."),
        make("bff2dcb37ef3a44ba43ab144768ca837", "He who has a shady past knows that nice guys finish last."),
        make("0441015ecb54a7342d017ed1bcfdbea5", "I wouldn't marry him with a ten foot pole."),
        make("9e3cac8e9e9757a60c3ea391130d3689", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("a0f04459b031f916a59a35cc482dc039", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("e7a48e0fe884faf31475d2a04b1362cc", "Nepal premier won't resign."),
        make("637d2fe925c07c113800509964fb0e06", "For every action there is an equal and opposite government program."),
        make("834a8d18d5c6562119cf4c7f5086cb71", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("de3a4d2fd6c73ec2db2abad23b444281", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("acf203f997e2cf74ea3aff86985aefaf", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("e1c1384cb4d2221dfdd7c795a4222c9a", "size:  a.out:  bad magic"),
        make("c90f3ddecc54f34228c063d7525bf644", "The major problem is with sendmail.  -Mark Horton"),
        make("cdf7ab6c1fd49bd9933c43f3ea5af185", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("83bc85234942fc883c063cbd7f0ad5d0", "If the enemy is within range, then so are you."),
        make("277cbe255686b48dd7e8f389394d9299", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("fd3fb0a7ffb8af16603f3d3af98f8e1f", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("469b13a78ebf297ecda64d4723655154", "C is as portable as Stonehedge!!"),
        make("63eb3a2f466410104731c4b037600110", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("72c2ed7592debca1c90fc0100f931a2f", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("132f7619d33b523b1d9e5bd8e0928355", "How can you write a big system without C++?  -Paul Glick"),
    ]
    const dst = new Uint8Array(MD5.hashsize)
    const md5 = new MD5()
    for (const t of tests) {
        assert.equal(t.out, encodeToString(MD5.sum(t.in)), `sum ${t.in}`)
        assert.equal(dst.length, MD5.sumTo(dst, t.in), `sumTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `sumTo ${t.in}`)

        assert.equal(t.out, encodeToString(md5.sum(t.in)), `md5.sum ${t.in}`)
        assert.equal(dst.length, md5.sumTo(dst, t.in), `md5.sumTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `md5.sumTo ${t.in}`)

        assert.equal(t.out, encodeToString(md5.done(t.in)), `md5.done ${t.in}`)
        md5.reset()

        assert.equal(dst.length, md5.doneTo(dst, t.in), `md5.doneTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `md5.doneTo ${t.in}`)
        md5.reset()


        const b = new TextEncoder().encode(t.in)
        if (b.length > 0) {
            md5.write(b.subarray(0, 1))
            const data = b.subarray(1)
            assert.equal(t.out, encodeToString(md5.sum(data)), `md5.write.sum ${t.in}`)
            assert.equal(dst.length, md5.sumTo(dst, data), `md5.write.sumTo ${t.in}`)
            assert.equal(t.out, encodeToString(dst), `md5.write.sumTo ${t.in}`)

            const h = md5.clone()
            assert.equal(t.out, encodeToString(h.done(data)), `md5.write.done ${t.in}`)

            assert.equal(dst.length, md5.doneTo(dst, data), `md5.write.doneTo ${t.in}`)
            assert.equal(t.out, encodeToString(dst), `md5.write.doneTo ${t.in}`)
            md5.reset()
        }
    }
})
