import { Assert, test } from "../../unit/unit";
import { Hash, MD5, SHA1, SHA256, SHA256_224, SHA3_224, SHA3_256, SHA3_384, SHA3_512, SHA512, SHA512_224, SHA512_256, SHA512_384 } from "ejs/hash";
import { encodeToString } from "ejs/encoding/hex";

const m = test.module("ejs/hash")
function make(out: string, input: string) {
    return {
        out: out,
        in: input,
    }
}

interface LessHash {
    get blocksize(): number
    get hashsize(): number
    sum(data?: string | Uint8Array): Uint8Array
    sumTo(dst: Uint8Array, data?: string | Uint8Array): number
}
function doTest(assert: Assert,
    tests: Array<{ out: string, in: string }>,
    name: string,
    H: LessHash, hash: Hash,
    blocksize: number, hashsize: number) {
    assert.equal(blocksize, H.blocksize, 'blocksize')
    assert.equal(hashsize, H.hashsize, 'hashsize')
    assert.equal(blocksize, hash.blocksize, `${name} blocksize`)
    assert.equal(hashsize, hash.hashsize, `${name} hashsize`)
    const dst = new Uint8Array(H.hashsize)
    for (const t of tests) {
        assert.equal(t.out, encodeToString(H.sum(t.in)), `sum ${t.in}`)
        assert.equal(dst.length, H.sumTo(dst, t.in), `sumTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `sumTo ${t.in}`)

        assert.equal(t.out, encodeToString(hash.sum(t.in)), `${name} sum ${t.in}`)
        assert.equal(dst.length, hash.sumTo(dst, t.in), `${name} sumTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `${name} sumTo ${t.in}`)

        assert.equal(t.out, encodeToString(hash.done(t.in)), `${name} done ${t.in}`)
        hash.reset()

        assert.equal(dst.length, hash.doneTo(dst, t.in), `${name} doneTo ${t.in}`)
        assert.equal(t.out, encodeToString(dst), `${name} doneTo ${t.in}`)
        hash.reset()


        const b = new TextEncoder().encode(t.in)
        if (b.length > 0) {
            hash.write(b.subarray(0, 1))
            const data = b.subarray(1)
            assert.equal(t.out, encodeToString(hash.sum(data)), `${name} write.sum ${t.in}`)
            assert.equal(dst.length, hash.sumTo(dst, data), `${name} write.sumTo ${t.in}`)
            assert.equal(t.out, encodeToString(dst), `${name} write.sumTo ${t.in}`)

            const h = hash.clone()
            assert.equal(t.out, encodeToString(h.done(data)), `${name} write.done ${t.in}`)

            assert.equal(dst.length, hash.doneTo(dst, data), `${name} write.doneTo ${t.in}`)
            assert.equal(t.out, encodeToString(dst), `${name} write.doneTo ${t.in}`)
            hash.reset()
        }
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
    doTest(assert, tests,
        'md5', MD5, new MD5(),
        64, 16,
    )
})
m.test("SHA1", (assert) => {
    const tests = [
        make("76245dbf96f661bd221046197ab8b9f063f11bad", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n"),
        make("da39a3ee5e6b4b0d3255bfef95601890afd80709", ""),
        make("86f7e437faa5a7fce15d1ddcb9eaeaea377667b8", "a"),
        make("da23614e02469a0d7c7bd1bdab5c9c474b1904dc", "ab"),
        make("a9993e364706816aba3e25717850c26c9cd0d89d", "abc"),
        make("81fe8bfe87576c3ecb22426f8e57847382917acf", "abcd"),
        make("03de6c570bfe24bfc328ccd7ca46b76eadaf4334", "abcde"),
        make("1f8ac10f23c5b5bc1167bda84b833e5c057a77d2", "abcdef"),
        make("2fb5e13419fc89246865e7a324f476ec624e8740", "abcdefg"),
        make("425af12a0743502b322e93a015bcf868e324d56a", "abcdefgh"),
        make("c63b19f1e4c8b5f76b25c49b8b87f57d8e4872a1", "abcdefghi"),
        make("d68c19a0a345b7eab78d5e11e991c026ec60db63", "abcdefghij"),
        make("ebf81ddcbe5bf13aaabdc4d65354fdf2044f38a7", "Discard medicine more than two years old."),
        make("e5dea09392dd886ca63531aaa00571dc07554bb6", "He who has a shady past knows that nice guys finish last."),
        make("45988f7234467b94e3e9494434c96ee3609d8f8f", "I wouldn't marry him with a ten foot pole."),
        make("55dee037eb7460d5a692d1ce11330b260e40c988", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("b7bc5fb91080c7de6b582ea281f8a396d7c0aee8", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("c3aed9358f7c77f523afe86135f06b95b3999797", "Nepal premier won't resign."),
        make("6e29d302bf6e3a5e4305ff318d983197d6906bb9", "For every action there is an equal and opposite government program."),
        make("597f6a540010f94c15d71806a99a2c8710e747bd", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("6859733b2590a8a091cecf50086febc5ceef1e80", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("514b2630ec089b8aee18795fc0cf1f4860cdacad", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("c5ca0d4a7b6676fc7aa72caa41cc3d5df567ed69", "size:  a.out:  bad magic"),
        make("74c51fa9a04eadc8c1bbeaa7fc442f834b90a00a", "The major problem is with sendmail.  -Mark Horton"),
        make("0b4c4ce5f52c3ad2821852a8dc00217fa18b8b66", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("3ae7937dd790315beb0f48330e8642237c61550a", "If the enemy is within range, then so are you."),
        make("410a2b296df92b9a47412b13281df8f830a9f44b", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("841e7c85ca1adcddbdd0187f1289acb5c642f7f5", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("163173b825d03b952601376b25212df66763e1db", "C is as portable as Stonehedge!!"),
        make("32b0377f2687eb88e22106f133c586ab314d5279", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("0885aaf99b569542fd165fa44e322718f4a984e0", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("6627d6904d71420b0bf3886ab629623538689f45", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha1', SHA1, new SHA1(),
        64, 20,
    )
})
m.test("SHA256", (assert) => {
    const tests = [
        make("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", ""),
        make("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "a"),
        make("fb8e20fc2e4c3f248c60c39bd652f3c1347298bb977b8b4d5903b85055620603", "ab"),
        make("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "abc"),
        make("88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589", "abcd"),
        make("36bbe50ed96841d10443bcb670d6554f0a34b761be67ec9c4a8ad2c0c44ca42c", "abcde"),
        make("bef57ec7f53a6d40beb640a780a639c83bc29ac8a9816f1fc6c5c6dcd93c4721", "abcdef"),
        make("7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c6527baf665d4da9a", "abcdefg"),
        make("9c56cc51b374c3ba189210d5b6d4bf57790d351c96c47c02190ecf1e430635ab", "abcdefgh"),
        make("19cc02f26df43cc571bc9ed7b0c4d29224a3ec229529221725ef76d021c8326f", "abcdefghi"),
        make("72399361da6a7754fec986dca5b7cbaf1c810a28ded4abaf56b2106d06cb78b0", "abcdefghij"),
        make("a144061c271f152da4d151034508fed1c138b8c976339de229c3bb6d4bbb4fce", "Discard medicine more than two years old."),
        make("6dae5caa713a10ad04b46028bf6dad68837c581616a1589a265a11288d4bb5c4", "He who has a shady past knows that nice guys finish last."),
        make("ae7a702a9509039ddbf29f0765e70d0001177914b86459284dab8b348c2dce3f", "I wouldn't marry him with a ten foot pole."),
        make("6748450b01c568586715291dfa3ee018da07d36bb7ea6f180c1af6270215c64f", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("14b82014ad2b11f661b5ae6a99b75105c2ffac278cd071cd6c05832793635774", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("7102cfd76e2e324889eece5d6c41921b1e142a4ac5a2692be78803097f6a48d8", "Nepal premier won't resign."),
        make("23b1018cd81db1d67983c5f7417c44da9deb582459e378d7a068552ea649dc9f", "For every action there is an equal and opposite government program."),
        make("8001f190dfb527261c4cfcab70c98e8097a7a1922129bc4096950e57c7999a5a", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("8c87deb65505c3993eb24b7a150c4155e82eee6960cf0c3a8114ff736d69cad5", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("bfb0a67a19cdec3646498b2e0f751bddc41bba4b7f30081b0b932aad214d16d7", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("7f9a0b9bf56332e19f5a0ec1ad9c1425a153da1c624868fda44561d6b74daf36", "size:  a.out:  bad magic"),
        make("b13f81b8aad9e3666879af19886140904f7f429ef083286195982a7588858cfc", "The major problem is with sendmail.  -Mark Horton"),
        make("b26c38d61519e894480c70c8374ea35aa0ad05b2ae3d6674eec5f52a69305ed4", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("049d5e26d4f10222cd841a119e38bd8d2e0d1129728688449575d4ff42b842c1", "If the enemy is within range, then so are you."),
        make("0e116838e3cc1c1a14cd045397e29b4d087aa11b0853fc69ec82e90330d60949", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("4f7d8eb5bcf11de2a56b971021a444aa4eafd6ecd0f307b5109e4e776cd0fe46", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("61c0cc4c4bd8406d5120b3fb4ebc31ce87667c162f29468b3c779675a85aebce", "C is as portable as Stonehedge!!"),
        make("1fb2eb3688093c4a3f80cd87a5547e2ce940a4f923243a79a2a1e242220693ac", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("395585ce30617b62c80b93e8208ce866d4edc811a177fdb4b82d3911d8696423", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("4f9b189a13d030838269dce846b16a1ce9ce81fe63e65de2f636863336a98fe6", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha256', SHA256, new SHA256(),
        64, 32,
    )
})
m.test("SHA256_224", (assert) => {
    const tests = [
        make("d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f", ""),
        make("abd37534c7d9a2efb9465de931cd7055ffdb8879563ae98078d6d6d5", "a"),
        make("db3cda86d4429a1d39c148989566b38f7bda0156296bd364ba2f878b", "ab"),
        make("23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7", "abc"),
        make("a76654d8e3550e9a2d67a0eeb6c67b220e5885eddd3fde135806e601", "abcd"),
        make("bdd03d560993e675516ba5a50638b6531ac2ac3d5847c61916cfced6", "abcde"),
        make("7043631cb415556a275a4ebecb802c74ee9f6153908e1792a90b6a98", "abcdef"),
        make("d1884e711701ad81abe0c77a3b0ea12e19ba9af64077286c72fc602d", "abcdefg"),
        make("17eb7d40f0356f8598e89eafad5f6c759b1f822975d9c9b737c8a517", "abcdefgh"),
        make("aeb35915346c584db820d2de7af3929ffafef9222a9bcb26516c7334", "abcdefghi"),
        make("d35e1e5af29ddb0d7e154357df4ad9842afee527c689ee547f753188", "abcdefghij"),
        make("19297f1cef7ddc8a7e947f5c5a341e10f7245045e425db67043988d7", "Discard medicine more than two years old."),
        make("0f10c2eb436251f777fbbd125e260d36aecf180411726c7c885f599a", "He who has a shady past knows that nice guys finish last."),
        make("4d1842104919f314cad8a3cd20b3cba7e8ed3e7abed62b57441358f6", "I wouldn't marry him with a ten foot pole."),
        make("a8ba85c6fe0c48fbffc72bbb2f03fcdbc87ae2dc7a56804d1590fb3b", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("5543fbab26e67e8885b1a852d567d1cb8b9bfe42e0899584c50449a9", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("65ca107390f5da9efa05d28e57b221657edc7e43a9a18fb15b053ddb", "Nepal premier won't resign."),
        make("84953962be366305a9cc9b5cd16ed019edc37ac96c0deb3e12cca116", "For every action there is an equal and opposite government program."),
        make("35a189ce987151dfd00b3577583cc6a74b9869eecf894459cb52038d", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("2fc333713983edfd4ef2c0da6fb6d6415afb94987c91e4069eb063e6", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("cbe32d38d577a1b355960a4bc3c659c2dc4670859a19777a875842c4", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("a2dc118ce959e027576413a7b440c875cdc8d40df9141d6ef78a57e1", "size:  a.out:  bad magic"),
        make("d10787e24052bcff26dc484787a54ed819e4e4511c54890ee977bf81", "The major problem is with sendmail.  -Mark Horton"),
        make("62efcf16ab8a893acdf2f348aaf06b63039ff1bf55508c830532c9fb", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("3e9b7e4613c59f58665104c5fa86c272db5d3a2ff30df5bb194a5c99", "If the enemy is within range, then so are you."),
        make("5999c208b8bdf6d471bb7c359ac5b829e73a8211dff686143a4e7f18", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("3b2d67ff54eabc4ef737b14edf87c64280ef582bcdf2a6d56908b405", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("d0733595d20e4d3d6b5c565a445814d1bbb2fd08b9a3b8ffb97930c6", "C is as portable as Stonehedge!!"),
        make("43fb8aeed8a833175c9295c1165415f98c866ef08a4922959d673507", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("ec18e66e93afc4fb1604bc2baedbfd20b44c43d76e65c0996d7851c6", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("86ed2eaa9c75ba98396e5c9fb2f679ecf0ea2ed1e0ee9ceecb4a9332", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha256_224', SHA256_224, new SHA256_224(),
        64, 28,
    )
})
m.test("SHA512", (assert) => {
    const tests = [
        make("cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e", ""),
        make("1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75", "a"),
        make("2d408a0717ec188158278a796c689044361dc6fdde28d6f04973b80896e1823975cdbf12eb63f9e0591328ee235d80e9b5bf1aa6a44f4617ff3caf6400eb172d", "ab"),
        make("ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f", "abc"),
        make("d8022f2060ad6efd297ab73dcc5355c9b214054b0d1776a136a669d26a7d3b14f73aa0d0ebff19ee333368f0164b6419a96da49e3e481753e7e96b716bdccb6f", "abcd"),
        make("878ae65a92e86cac011a570d4c30a7eaec442b85ce8eca0c2952b5e3cc0628c2e79d889ad4d5c7c626986d452dd86374b6ffaa7cd8b67665bef2289a5c70b0a1", "abcde"),
        make("e32ef19623e8ed9d267f657a81944b3d07adbb768518068e88435745564e8d4150a0a703be2a7d88b61e3d390c2bb97e2d4c311fdc69d6b1267f05f59aa920e7", "abcdef"),
        make("d716a4188569b68ab1b6dfac178e570114cdf0ea3a1cc0e31486c3e41241bc6a76424e8c37ab26f096fc85ef9886c8cb634187f4fddff645fb099f1ff54c6b8c", "abcdefg"),
        make("a3a8c81bc97c2560010d7389bc88aac974a104e0e2381220c6e084c4dccd1d2d17d4f86db31c2a851dc80e6681d74733c55dcd03dd96f6062cdda12a291ae6ce", "abcdefgh"),
        make("f22d51d25292ca1d0f68f69aedc7897019308cc9db46efb75a03dd494fc7f126c010e8ade6a00a0c1a5f1b75d81e0ed5a93ce98dc9b833db7839247b1d9c24fe", "abcdefghi"),
        make("ef6b97321f34b1fea2169a7db9e1960b471aa13302a988087357c520be957ca119c3ba68e6b4982c019ec89de3865ccf6a3cda1fe11e59f98d99f1502c8b9745", "abcdefghij"),
        make("2210d99af9c8bdecda1b4beff822136753d8342505ddce37f1314e2cdbb488c6016bdaa9bd2ffa513dd5de2e4b50f031393d8ab61f773b0e0130d7381e0f8a1d", "Discard medicine more than two years old."),
        make("a687a8985b4d8d0a24f115fe272255c6afaf3909225838546159c1ed685c211a203796ae8ecc4c81a5b6315919b3a64f10713da07e341fcdbb08541bf03066ce", "He who has a shady past knows that nice guys finish last."),
        make("8ddb0392e818b7d585ab22769a50df660d9f6d559cca3afc5691b8ca91b8451374e42bcdabd64589ed7c91d85f626596228a5c8572677eb98bc6b624befb7af8", "I wouldn't marry him with a ten foot pole."),
        make("26ed8f6ca7f8d44b6a8a54ae39640fa8ad5c673f70ee9ce074ba4ef0d483eea00bab2f61d8695d6b34df9c6c48ae36246362200ed820448bdc03a720366a87c6", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("e5a14bf044be69615aade89afcf1ab0389d5fc302a884d403579d1386a2400c089b0dbb387ed0f463f9ee342f8244d5a38cfbc0e819da9529fbff78368c9a982", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("420a1faa48919e14651bed45725abe0f7a58e0f099424c4e5a49194946e38b46c1f8034b18ef169b2e31050d1648e0b982386595f7df47da4b6fd18e55333015", "Nepal premier won't resign."),
        make("d926a863beadb20134db07683535c72007b0e695045876254f341ddcccde132a908c5af57baa6a6a9c63e6649bba0c213dc05fadcf9abccea09f23dcfb637fbe", "For every action there is an equal and opposite government program."),
        make("9a98dd9bb67d0da7bf83da5313dff4fd60a4bac0094f1b05633690ffa7f6d61de9a1d4f8617937d560833a9aaa9ccafe3fd24db418d0e728833545cadd3ad92d", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("d7fde2d2351efade52f4211d3746a0780a26eec3df9b2ed575368a8a1c09ec452402293a8ea4eceb5a4f60064ea29b13cdd86918cd7a4faf366160b009804107", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("b0f35ffa2697359c33a56f5c0cf715c7aeed96da9905ca2698acadb08fbc9e669bf566b6bd5d61a3e86dc22999bcc9f2224e33d1d4f32a228cf9d0349e2db518", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("3d2e5f91778c9e66f7e061293aaa8a8fc742dd3b2e4f483772464b1144189b49273e610e5cccd7a81a19ca1fa70f16b10f1a100a4d8c1372336be8484c64b311", "size:  a.out:  bad magic"),
        make("b2f68ff58ac015efb1c94c908b0d8c2bf06f491e4de8e6302c49016f7f8a33eac3e959856c7fddbc464de618701338a4b46f76dbfaf9a1e5262b5f40639771c7", "The major problem is with sendmail.  -Mark Horton"),
        make("d8c92db5fdf52cf8215e4df3b4909d29203ff4d00e9ad0b64a6a4e04dec5e74f62e7c35c7fb881bd5de95442123df8f57a489b0ae616bd326f84d10021121c57", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("19a9f8dc0a233e464e8566ad3ca9b91e459a7b8c4780985b015776e1bf239a19bc233d0556343e2b0a9bc220900b4ebf4f8bdf89ff8efeaf79602d6849e6f72e", "If the enemy is within range, then so are you."),
        make("00b4c41f307bde87301cdc5b5ab1ae9a592e8ecbb2021dd7bc4b34e2ace60741cc362560bec566ba35178595a91932b8d5357e2c9cec92d393b0fa7831852476", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("91eccc3d5375fd026e4d6787874b1dce201cecd8a27dbded5065728cb2d09c58a3d467bb1faf353bf7ba567e005245d5321b55bc344f7c07b91cb6f26c959be7", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("fabbbe22180f1f137cfdc9556d2570e775d1ae02a597ded43a72a40f9b485d500043b7be128fb9fcd982b83159a0d99aa855a9e7cc4240c00dc01a9bdf8218d7", "C is as portable as Stonehedge!!"),
        make("2ecdec235c1fa4fc2a154d8fba1dddb8a72a1ad73838b51d792331d143f8b96a9f6fcb0f34d7caa351fe6d88771c4f105040e0392f06e0621689d33b2f3ba92e", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("7ad681f6f96f82f7abfa7ecc0334e8fa16d3dc1cdc45b60b7af43fe4075d2357c0c1d60e98350f1afb1f2fe7a4d7cd2ad55b88e458e06b73c40b437331f5dab4", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("833f9248ab4a3b9e5131f745fda1ffd2dd435b30e965957e78291c7ab73605fd1912b0794e5c233ab0a12d205a39778d19b83515d6a47003f19cdee51d98c7e0", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha512', SHA512, new SHA512(),
        128, 64,
    )
})
m.test("SHA512_384", (assert) => {
    const tests = [
        make("38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b", ""),
        make("54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31", "a"),
        make("c7be03ba5bcaa384727076db0018e99248e1a6e8bd1b9ef58a9ec9dd4eeebb3f48b836201221175befa74ddc3d35afdd", "ab"),
        make("cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7", "abc"),
        make("1165b3406ff0b52a3d24721f785462ca2276c9f454a116c2b2ba20171a7905ea5a026682eb659c4d5f115c363aa3c79b", "abcd"),
        make("4c525cbeac729eaf4b4665815bc5db0c84fe6300068a727cf74e2813521565abc0ec57a37ee4d8be89d097c0d2ad52f0", "abcde"),
        make("c6a4c65b227e7387b9c3e839d44869c4cfca3ef583dea64117859b808c1e3d8ae689e1e314eeef52a6ffe22681aa11f5", "abcdef"),
        make("9f11fc131123f844c1226f429b6a0a6af0525d9f40f056c7fc16cdf1b06bda08e302554417a59fa7dcf6247421959d22", "abcdefg"),
        make("9000cd7cada59d1d2eb82912f7f24e5e69cc5517f68283b005fa27c285b61e05edf1ad1a8a9bded6fd29eb87d75ad806", "abcdefgh"),
        make("ef54915b60cf062b8dd0c29ae3cad69abe6310de63ac081f46ef019c5c90897caefd79b796cfa81139788a260ded52df", "abcdefghi"),
        make("a12070030a02d86b0ddacd0d3a5b598344513d0a051e7355053e556a0055489c1555399b03342845c4adde2dc44ff66c", "abcdefghij"),
        make("86f58ec2d74d1b7f8eb0c2ff0967316699639e8d4eb129de54bdf34c96cdbabe200d052149f2dd787f43571ba74670d4", "Discard medicine more than two years old."),
        make("ae4a2b639ca9bfa04b1855d5a05fe7f230994f790891c6979103e2605f660c4c1262a48142dcbeb57a1914ba5f7c3fa7", "He who has a shady past knows that nice guys finish last."),
        make("40ae213df6436eca952aa6841886fcdb82908ef1576a99c8f49bb9dd5023169f7c53035abdda0b54c302f4974e2105e7", "I wouldn't marry him with a ten foot pole."),
        make("e7cf8b873c9bc950f06259aa54309f349cefa72c00d597aebf903e6519a50011dfe355afff064a10701c705693848df9", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("c3d4f0f4047181c7d39d34703365f7bf70207183caf2c2f6145f04da895ef69124d9cdeb635da636c3a474e61024e29b", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("a097aab567e167d5cf93676ed73252a69f9687cb3179bb2d27c9878119e94bf7b7c4b58dc90582edfaf66e11388ed714", "Nepal premier won't resign."),
        make("5026ca45c41fc64712eb65065da92f6467541c78f8966d3fe2c8e3fb769a3ec14215f819654b47bd64f7f0eac17184f3", "For every action there is an equal and opposite government program."),
        make("ac1cc0f5ac8d5f5514a7b738ac322b7fb52a161b449c3672e9b6a6ad1a5e4b26b001cf3bad24c56598676ca17d4b445a", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("722d10c5de371ec0c8c4b5247ac8a5f1d240d68c73f8da13d8b25f0166d6f309bf9561979a111a0049405771d201941a", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("dc2d3ea18bfa10549c63bf2b75b39b5167a80c12aff0e05443168ea87ff149fb0eda5e0bd234eb5d48c7d02ffc5807f1", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("1d67c969e2a945ae5346d2139760261504d4ba164c522443afe19ef3e29b152a4c52445489cfc9d7215e5a450e8e1e4e", "size:  a.out:  bad magic"),
        make("5ff8e075e465646e7b73ef36d812c6e9f7d60fa6ea0e533e5569b4f73cde53cdd2cc787f33540af57cca3fe467d32fe0", "The major problem is with sendmail.  -Mark Horton"),
        make("5bd0a997a67c9ae1979a894eb0cde403dde003c9b6f2c03cf21925c42ff4e1176e6df1ca005381612ef18457b9b7ec3b", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("1eee6da33e7e54fc5be52ae23b94b16ba4d2a947ae4505c6a3edfc7401151ea5205ac01b669b56f27d8ef7f175ed7762", "If the enemy is within range, then so are you."),
        make("76b06e9dea66bfbb1a96029426dc0dfd7830bd297eb447ff5358d94a87cd00c88b59df2493fef56ecbb5231073892ea9", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("12acaf21452cff586143e3f5db0bfdf7802c057e1adf2a619031c4e1b0ccc4208cf6cef8fe722bbaa2fb46a30d9135d8", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("0fc23d7f4183efd186f0bc4fc5db867e026e2146b06cb3d52f4bdbd57d1740122caa853b41868b197b2ac759db39df88", "C is as portable as Stonehedge!!"),
        make("bc805578a7f85d34a86a32976e1c34fe65cf815186fbef76f46ef99cda10723f971f3f1464d488243f5e29db7488598d", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("b23918399a12ebf4431559eec3813eaf7412e875fd7464f16d581e473330842d2e96c6be49a7ce3f9bb0b8bc0fcbe0fe", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("1764b700eb1ead52a2fc33cc28975c2180f1b8faa5038d94cffa8d78154aab16e91dd787e7b0303948ebed62561542c8", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha512_384', SHA512_384, new SHA512_384(),
        128, 48,
    )
})
m.test("SHA512_256", (assert) => {
    const tests = [
        make("c672b8d1ef56ed28ab87c3622c5114069bdd3ad7b8f9737498d0c01ecef0967a", ""),
        make("455e518824bc0601f9fb858ff5c37d417d67c2f8e0df2babe4808858aea830f8", "a"),
        make("22d4d37ec6370571af7109fb12eae79673d5f7c83e6e677083faa3cfac3b2c14", "ab"),
        make("53048e2681941ef99b2e29b76b4c7dabe4c2d0c634fc6d46e0e2f13107e7af23", "abc"),
        make("d2891c7978be0e24948f37caa415b87cb5cbe2b26b7bad9dc6391b8a6f6ddcc9", "abcd"),
        make("de8322b46e78b67d4431997070703e9764e03a1237b896fd8b379ed4576e8363", "abcde"),
        make("e4fdcb11d1ac14e698743acd8805174cea5ddc0d312e3e47f6372032571bad84", "abcdef"),
        make("a8117f680bdceb5d1443617cbdae9255f6900075422326a972fdd2f65ba9bee3", "abcdefg"),
        make("a29b9645d2a02a8b582888d044199787220e316bf2e89d1422d3df26bf545bbe", "abcdefgh"),
        make("b955095330f9c8188d11884ec1679dc44c9c5b25ff9bda700416df9cdd39188f", "abcdefghi"),
        make("550762913d51eefbcd1a55068fcfc9b154fd11c1078b996df0d926ea59d2a68d", "abcdefghij"),
        make("690c8ad3916cefd3ad29226d9875965e3ee9ec0d4482eacc248f2ff4aa0d8e5b", "Discard medicine more than two years old."),
        make("25938ca49f7ef1178ce81620842b65e576245fcaed86026a36b516b80bb86b3b", "He who has a shady past knows that nice guys finish last."),
        make("698e420c3a7038e53d8e73f4be2b02e03b93464ac1a61ebe69f557079921ef65", "I wouldn't marry him with a ten foot pole."),
        make("839b414d7e3900ee243aa3d1f9b6955720e64041f5ab9bedd3eb0a08da5a2ca8", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("5625ecb9d284e54c00b257b67a8cacb25a78db2845c60ef2d29e43c84f236e8e", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("9b81d06bca2f985e6ad3249096ff3c0f2a9ec5bb16ef530d738d19d81e7806f2", "Nepal premier won't resign."),
        make("08241df8d91edfcd68bb1a1dada6e0ae1475a5c6e7b8f12d8e24ca43a38240a9", "For every action there is an equal and opposite government program."),
        make("4ff74d9213a8117745f5d37b5353a774ec81c5dfe65c4c8986a56fc01f2c551e", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("b5baf747c307f98849ec881cf0d48605ae4edd386372aea9b26e71db517e650b", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("7eef0538ebd7ecf18611d23b0e1cd26a74d65b929a2e374197dc66e755ca4944", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("d05600964f83f55323104aadab434f32391c029718a7690d08ddb2d7e8708443", "size:  a.out:  bad magic"),
        make("53ed5f9b5c0b674ac0f3425d9f9a5d462655b07cc90f5d0f692eec093884a607", "The major problem is with sendmail.  -Mark Horton"),
        make("5a0147685a44eea2435dbd582724efca7637acd9c428e5e1a05115bc3bc2a0e0", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("1152c9b27a99dbf4057d21438f4e63dd0cd0977d5ff12317c64d3b97fcac875a", "If the enemy is within range, then so are you."),
        make("105e890f5d5cf1748d9a7b4cdaf58b69855779deebc2097747c2210a17b2cb51", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("74644ead770da1434365cd912656fe1aca2056d3039d39f10eb1151bddb32cf3", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("50a234625de5587581883dad9ef399460928032a5ea6bd005d7dc7b68d8cc3d6", "C is as portable as Stonehedge!!"),
        make("a7a3846005f8a9935a0a2d43e7fd56d95132a9a3609bf3296ef80b8218acffa0", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("688ff03e367680757aa9906cb1e2ad218c51f4526dc0426ea229a5ba9d002c69", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("3fa46d52094b01021cff5af9a438982b887a5793f624c0a6644149b6b7c3f485", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha512_256', SHA512_256, new SHA512_256(),
        128, 32,
    )
})
m.test("SHA512_224", (assert) => {
    const tests = [
        make("6ed0dd02806fa89e25de060c19d3ac86cabb87d6a0ddd05c333b84f4", ""),
        make("d5cdb9ccc769a5121d4175f2bfdd13d6310e0d3d361ea75d82108327", "a"),
        make("b35878d07bfedf39fc638af08547eb5d1072d8546319f247b442fbf5", "ab"),
        make("4634270f707b6a54daae7530460842e20e37ed265ceee9a43e8924aa", "abc"),
        make("0c9f157ab030fb06e957c14e3938dc5908962e5dd7b66f04a36fc534", "abcd"),
        make("880e79bb0a1d2c9b7528d851edb6b8342c58c831de98123b432a4515", "abcde"),
        make("236c829cfea4fd6d4de61ad15fcf34dca62342adaf9f2001c16f29b8", "abcdef"),
        make("4767af672b3ed107f25018dc22d6fa4b07d156e13b720971e2c4f6bf", "abcdefg"),
        make("792e25e0ae286d123a38950007e037d3122e76c4ee201668c385edab", "abcdefgh"),
        make("56b275d36127dc070cda4019baf2ce2579a25d8c67fa2bc9be61b539", "abcdefghi"),
        make("f809423cbb25e81a2a64aecee2cd5fdc7d91d5db583901fbf1db3116", "abcdefghij"),
        make("4c46e10b5b72204e509c3c06072cea970bc020cd45a61a0acdfa97ac", "Discard medicine more than two years old."),
        make("cb0cef13c1848d91a6d02637c7c520de1914ad4a7aea824671cc328e", "He who has a shady past knows that nice guys finish last."),
        make("6c7bd0f3a6544ea698006c2ea583a85f80ea2913590a186db8bb2f1b", "I wouldn't marry him with a ten foot pole."),
        make("981323be3eca6ccfa598e58dd74ed8cb05d5f7f6653b7604b684f904", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("e6fbf82df5138bf361e826903cadf0612cb2986649ba47a57e1bca99", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("6ec2cb2ecafc1a9bddaf4caf57344d853e6ded398927d5694fd7714f", "Nepal premier won't resign."),
        make("7f62f36e716e0badaf4a4658da9d09bea26357a1bc6aeb8cf7c3ae35", "For every action there is an equal and opposite government program."),
        make("45adffcb86a05ee4d91263a6115dda011b805d442c60836963cb8378", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("51cb518f1f68daa901a3075a0a5e1acc755b4e5c82cb47687537f880", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("3b59c5e64b0da7bfc18d7017bf458d90f2c83601ff1afc6263ac0993", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("6a9525c0fac0f91b489bc4f0f539b9ec4a156a4e98bc15b655c2c881", "size:  a.out:  bad magic"),
        make("a1b2b2905b1527d682049c6a76e35c7d8c72551abfe7833ac1be595f", "The major problem is with sendmail.  -Mark Horton"),
        make("76cf045c76a5f2e3d64d56c3cdba6a25479334611bc375460526f8c1", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("4473671daeecfdb6f6c5bc06b26374aa5e497cc37119fe14144c430c", "If the enemy is within range, then so are you."),
        make("6accb6394758523fcd453d47d37ebd10868957a0a9e81c796736abf8", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("6f173f4b6eac7f2a73eaa0833c4563752df2c869dc00b7d30219e12e", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("db05bf4d0f73325208755f4af96cfac6cb3db5dbfc323d675d68f938", "C is as portable as Stonehedge!!"),
        make("05ffa71bb02e855de1aaee1777b3bdbaf7507646f19c4c6aa29933d0", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("3ad3c89e15b91e6273534c5d18adadbb528e7b840b288f64e81b8c6d", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("e3763669d1b760c1be7bfcb6625f92300a8430419d1dbad57ec9f53c", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha512_224', SHA512_224, new SHA512_224(),
        128, 28,
    )
})
m.test("SHA3_512", (assert) => {
    const tests = [
        make("a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26", ""),
        make("697f2d856172cb8309d6b8b97dac4de344b549d4dee61edfb4962d8698b7fa803f4f93ff24393586e28b5b957ac3d1d369420ce53332712f997bd336d09ab02a", "a"),
        make("01c87b5e8f094d8725ed47be35430de40f6ab6bd7c6641a4ecf0d046c55cb468453796bb61724306a5fb3d90fbe3726a970e5630ae6a9cf9f30d2aa062a0175e", "ab"),
        make("b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0", "abc"),
        make("6eb7b86765bf96a8467b72401231539cbb830f6c64120954c4567272f613f1364d6a80084234fa3400d306b9f5e10c341bbdc5894d9b484a8c7deea9cbe4e265", "abcd"),
        make("1d7c3aa6ee17da5f4aeb78be968aa38476dbee54842e1ae2856f4c9a5cd04d45dc75c2902182b07c130ed582d476995b502b8777ccf69f60574471600386639b", "abcde"),
        make("01309a45c57cd7faef9ee6bb95fed29e5e2e0312af12a95fffeee340e5e5948b4652d26ae4b75976a53cc1612141af6e24df36517a61f46a1a05f59cf667046a", "abcdef"),
        make("9c93345c31ecffe20a95eca8db169f1b3ee312dd75fb3494cc1dc2f9a2b6092b6cbebf1299ec6d5ba46b08f728f3075109582bc71b97b4deac5122433732234c", "abcdefg"),
        make("c9f25eee75ab4cf9a8cfd44f4992b282079b64d94647edbd88e818e44f701edeb450818f7272cba7a20205b3671ce1991ce9a6d2df8dbad6e0bb3e50493d7fa7", "abcdefgh"),
        make("4dbdf4a9fc84c246217a68d5a8f3d2a761766cf78752057d60b730a4a8226ef99bbf580c85468f5e93d8fb7873bbdb0de44314e3adf4b94a4fc37c64ca949c6e", "abcdefghi"),
        make("b3e0886fff5ca1df436bf4f6efc124219f908c0abec14036e392a3204f4208b396da0da40e3273f596d4d3db1be4627a16f34230af12ccea92d5d107471551d7", "abcdefghij"),
        make("cdbe0f69c23a9e28868ba75199c7f1a8b3981e2e2acb4ec0e4c0b2909748aa5ad694df8421fa7227b126c8630bd8d7df10abf9af8175d3b14f48d067f0d45751", "Discard medicine more than two years old."),
        make("9c1ff535f65e01009f43962df239d02b62c9a407b243f7aac22902cb40c40d9f31f1b854e8863bf5f9a709bd60c8709bb551663a16649538cbfc0a7ca628a15d", "He who has a shady past knows that nice guys finish last."),
        make("947ed1a0e3ae36ecc4ac4f47555145a168d6a76781f490760073cf552119cedae054991b9b36e7732ad6f4b47c27e6bcd454112cc9afaf31a8d98c63ede6fb9e", "I wouldn't marry him with a ten foot pole."),
        make("642d05bee15e9be5c1753b5d287e7c7d8e4bba71f033051b9639d68d6986b100a835ca2e3a56d92f7b1d0131ea5fe5c6b455a68096909a1aa50be618c3023f3f", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("682e5a3789000931f241764555d5b5a433f8acab2bc0c75ce87098da7dabbbfe75112188ffc09d27a58777a1a2d60f68371b882c379654b4c08241ed2ff1a641", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("afe1ea67e5fe293d9f777a30fc989120e74298bd9fef145ab1e93428f1c2c96c205410f92fbf01fa7f044acfcc211d9536a6de7608b13107ae29858fe4147673", "Nepal premier won't resign."),
        make("bd0bb214567df7f33574df4b94282aecc9fcdf7994a7bc2ec7e2ca1bd91a80ccf5d9b7e8bb612ba0822be9204fc4b69176c9e1f8f08d0b85112c7d2cfba0ce83", "For every action there is an equal and opposite government program."),
        make("8fa082e5aa0715609f091a4f26a6eead6e2981b0f47fcb6022b44882ee90e9058b751fbfcc18fd80483a0ba8801760f501735e6393af1a51bc2fa13743248aa5", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("c75eb421b65d31ce97b2e07bec9f886872fc99a2bc7f16f96b5b5cde7aff4a956a8148908b45d5c055203f2fb27af18497e094afe7b4f135482b0913550d271c", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("aab837a0b8ebf39793c18e6537e907f9afb689304cb0ac6ab0e3beab252d2a18c031097e5c339c15995e3ab00b89474d1f5ee5f725d33ecc48a8dc8485e7d06d", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("d46926b54fc8f01bf55e1691f7101a8465010c73aa816bf17d85028a7bcbfc7401dce92ba02b67c97ac4084ff44dab6cef59f53807a55a394a38fa5bbdd1b653", "size:  a.out:  bad magic"),
        make("c6d352f69392f517af7ef9b88d241fd721adfecb42776fc3f209d55f9dbd9a1c92e0285c4998a2d1af05dc37634bbad4314a637e8e09a0f8aacd6e119c08b9e3", "The major problem is with sendmail.  -Mark Horton"),
        make("51bbcd6146dd15ff70a67fd2fc7eedfcf49f37949f828fe79405cf0b781a6dac6e37cd5b50d7f0e354efb2d529d89822f8137c90f0973862e33a86bdb43e7ac4", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("fc62ee9035dde34c0f02aafb059e25862bd0e83dcb6541d51def740899654542978087852fd1c7ad0e81dd16afec84ea750adbc5f57f3302657aa9146c42b183", "If the enemy is within range, then so are you."),
        make("81b7246e4de75d4670284f75c0e573bb98b1880c48d053f3d83327b3043c85a4347109665bebda905417e2ab67849b213538cd42ae649b665b29bc8f789b762e", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("fa168294b8b20d30e1ef5a99902e1d9a72871489f9a2f5db239f8ea53a9f61ccb53a34f6ebc65f42bbe171f09cfab7567f4b082b39fd76ee1b75c9f66e2235c5", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("c393a04c1c1ce02599fed493df145d9c2284f9aa11e84bc5f99e3f455696c47fcd66944bd4df1655239f318a6343db800132e10c469b0ffd8f264e2be3f1a7e6", "C is as portable as Stonehedge!!"),
        make("c527929662b81db100d4dfc4f48a7bb540ef9df7d120accac53bbd1b42cd4b918d2da10015b4f448129bc1eb1d1fd733f1bc1f79f9cfba6e8b324fe84132b118", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("2a0bc1d2be8124c38f8db4a36cb23d92e30114ca4cfce8f42ef850fa66091deb1d41aef4055c75446c44d8c102539113a446cd03d480faf0b75124abdcb1e70a", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("0eda1355f62c135098433b44c2395ee67a6be4fd411396a7bdc5b9f7e04bb5cff251ae2ca3fce25310b2404217a03ed289a4b3e7505891371d6329337d15d0d4", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha3_512', SHA3_512, new SHA3_512(),
        72, 64,
    )
})
m.test("SHA3_384", (assert) => {
    const tests = [
        make("0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004", ""),
        make("1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9", "a"),
        make("dc30f83fefe3396fa0bd9709bcad28394386aa4e28ae881dc6617b361b16b969fb6a50a109068f13127b6deffbc82d4b", "ab"),
        make("ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25", "abc"),
        make("5af1d89732d4d10cc6e92a36756f68ecfbf7ae4d14ed4523f68fc304cccfa5b0bba01c80d0d9b67f9163a5c211cfd65b", "abcd"),
        make("348494236b82edda7602c78ba67fc3838e427c63c23e2c9d9aa5ea6354218a3c2ca564679acabf3ac6bf5378047691c4", "abcde"),
        make("d77460b0ce6109168480e279a81af32facb689ab96e22623f0122ff3a10ead263db6607f83876a843d3264dc2a863805", "abcdef"),
        make("49fbbd02884ae664e095edce429aa5b33d85886466de599eff29e1a0367eb16ff7e749d3966c0d4ade9903bd5867d051", "abcdefg"),
        make("f4d9fc5e9f44eb87fe968fc8e4e4691eb1dab6d821fb77550b527f71ccfb1ba043851bb054f281364c44d8541904db5a", "abcdefgh"),
        make("36e2a92c181adfd48e897f8041e31bbf3a89fbcf50911e686343aa33c165553b5da8cc2d9b2acc943687e540388d4233", "abcdefghi"),
        make("47d08a0d154110ff6dfd8bcea5ad9d14b75918d0b032201b0fd079acf9aebf34cc7bcd32cb1b82f7fff43d7012816e4d", "abcdefghij"),
        make("f61de1a171ab20c26eacd4ef67c3c456bac8e6f88ee45d25a2b8847e50223327659b88c956847582d9ebf1d68f67c351", "Discard medicine more than two years old."),
        make("e1713d2af773e4547254e12a8dee23cbe1fbc296f250c813bf7d9b5fbeffea15eddffda5eda97c50f2a23ba1e4d4c4f2", "He who has a shady past knows that nice guys finish last."),
        make("a585e3642594ccfba843761a4e4424d90e8a706a76bf9282b4e89231d7f1d8ecc4a69e22b82bda88ab069addb2993349", "I wouldn't marry him with a ten foot pole."),
        make("0eb7a0a253f088340ef852cd79d8f5383b789b10c4d192987c2aa85a514e618eeb573e9b227ecc90034c89f09e91671d", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("cd06848928aa99de4bf135a2ee8b10e38e8e317611f7b82c37b51dd72ac8141960460f09da4833356fbd71ad9de97578", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("7434af599e495e88a9e5d2df9a85721101dc10e9f902c0d87236a84117354378479940822106e19458bab404ddeafc01", "Nepal premier won't resign."),
        make("dda17f288e1ad1b73b185cd21bb9065a760a716b22080dbc0717dde04f766a9275682d79da5fca9e482474a84f2289b7", "For every action there is an equal and opposite government program."),
        make("a5425c4c1c77b1023aea1365004ca63c151f2a67496d3b3d04425efabf489f7815555b4228b21d75b01a42ea5aca7d0c", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("da68554b227b1f33b7c734c49dbd6c455e13c193f49c2729833abe74280bc3e3ee5d4833a9525640cae2fc50813d8294", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("97225141b19b1c745213f272375cd2264a1cde87703cdf8753c7a4a285c94066b8ea02072e1489a707ef26988642ee62", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("3b82d98ba7e70aabc6a1a2b2a555cd792a2592b0f1a32bd503dea0d25b5b038294d3dd50273223c77b300087697524e4", "size:  a.out:  bad magic"),
        make("17975f47a7e5ca424cbc5eb560990b32f81d04f229a122e315eac782d076df6d3dffe09e5f20c2bf7dd22f6b5f763b70", "The major problem is with sendmail.  -Mark Horton"),
        make("388b00147181793e93b045a64ecf255af34588179dca065652d9fcd5e8f7b227fadbafee249e5f14c0c9c70753d26b5c", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("656470e0a07fce2c588e4108e1e136bc709c4bc70dee6bf585728703fd6154a7aa89a4ba5dfdb9a5a6d3c071bf71ce2a", "If the enemy is within range, then so are you."),
        make("8dd38511bee25414bdd1224e95e5901cc9f426bece9d052eee79a4b2930b23c0b1ba3836b0a5fdb6a9a5b2858e5fbddf", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("80f6ee8048aba9a0a872b766f2e2d7b18523717fe774dcd3a8eddddf126d34638927db49d2ae789c4b1c6d9be744b21a", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("abf4b22bfb9129a55fd5b3b2960b05c61a7e1a48861afcdf4506ffe86658de4679a0f89431c8445122625e9dd59da888", "C is as portable as Stonehedge!!"),
        make("fff1290299d2e40be8b238bb371ec82975391654fc6313c2584cc91cb9c73626bdd3e450681fa5175726127f5166776c", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("cd0ce3b12c461b6fab1b091ab9ad50ffd33c4b301a1b5fd6eba095c51bf340849e95176117d747815673c4e8dae94843", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("d36cd5a343bf6bd83002af57f6b0902779773d46dc3ce231ab6188a3cfe24afe926ab861da03fb96a3baaa39bc15371e", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha3_384', SHA3_384, new SHA3_384(),
        104, 48,
    )
})
m.test("SHA3_256", (assert) => {
    const tests = [
        make("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a", ""),
        make("80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b", "a"),
        make("5c828b33397f4762922e39a60c35699d2550466a52dd15ed44da37eb0bdc61e6", "ab"),
        make("3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532", "abc"),
        make("6f6f129471590d2c91804c812b5750cd44cbdfb7238541c451e1ea2bc0193177", "abcd"),
        make("d716ec61e18904a8f58679b71cb065d4d5db72e0e0c3f155a4feff7add0e58eb", "abcde"),
        make("59890c1d183aa279505750422e6384ccb1499c793872d6f31bb3bcaa4bc9f5a5", "abcdef"),
        make("7d55114476dfc6a2fbeaa10e221a8d0f32fc8f2efb69a6e878f4633366917a62", "abcdefg"),
        make("3e2020725a38a48eb3bbf75767f03a22c6b3f41f459c831309b06433ec649779", "abcdefgh"),
        make("f74eb337992307c22bc59eb43e59583a683f3b93077e7f2472508e8c464d2657", "abcdefghi"),
        make("d97f84d48722153838d4ede4f8ac5f9dea8abce77cd7367b2eb0dc500a36fbb4", "abcdefghij"),
        make("e3b22a5c33f8001b503c54c3c301c86fd18fee24785424e211621a4e7184d883", "Discard medicine more than two years old."),
        make("1f024787815858a4498ea92589e4e4ddb573d38707860121b12433414f25be75", "He who has a shady past knows that nice guys finish last."),
        make("bab16090e4b6c44a21b20051d947994b1ddd8c6e7852fdb79e682f5fed42c733", "I wouldn't marry him with a ten foot pole."),
        make("8266964ae94d45ab67821d810c18c263d92827818b5066b0198e1fc5f65124a1", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("86a9fd7ab1d228b1dd452afe8e699d8e4af8bb76115bb0b1abf7e33fcf4f0aba", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("69ecbdaf520318565349f4196b421a58fcab459f30e305b3c178e258289188ac", "Nepal premier won't resign."),
        make("b35f15904675da9e5f5fc4d445210b837ecc66c227e9cf85054bde3d72890d95", "For every action there is an equal and opposite government program."),
        make("9e2df3744ba4a28e68227aea799bef9d02d834cec1dfdbc762012f48c32b0404", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("ef8a7d7001f7e9135027e903243707e3d6a92960ba5ad5393fddf669607f2788", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("33b94e962e9fa344a4eea13e7a94da863fa65adb1d299311c3174e379129948f", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("50fe5ee41a86d50b517bed295bd84fe44712590e3c4f62b971fa512aa3a4f3db", "size:  a.out:  bad magic"),
        make("7f905932d39118e2c89814f3dad5c27cf0df4f21242b9916e7e15cec61bf3e3c", "The major problem is with sendmail.  -Mark Horton"),
        make("07fc6febe4075ed5b3855bc28c707fdfef9b5875dc8d2f0f6b4accf0cc0b245f", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("924e9ef2ded81ed729c9552878c7aadd6beada29e6c4b059df895752893ec16a", "If the enemy is within range, then so are you."),
        make("cba17fc956a0b78c1922d350529ef54aa9b9832efa315b025ffa698e72862d26", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("a789ec07b1ea22e176d10e80b26adb0d6681682cde21c5c76cb0317ca6ade75a", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("ab8bd93741935e7fb6566d30e087fca28f5e79ce80b6f477fa50ee1fd14d0f0d", "C is as portable as Stonehedge!!"),
        make("366420300abeef217f5df49f613d1409e007054f0d62bc57525c2a9afc082adf", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("5b76f64d84aa336381bceea0ed17a27352a3314aee76d133f993760913e23b64", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("e68763c08bc834679e350158a57e3caf2444d9a59b7494b47202dcc4e7f55f41", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha3_256', SHA3_256, new SHA3_256(),
        136, 32,
    )
})
m.test("SHA3_224", (assert) => {
    const tests = [
        make("6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7", ""),
        make("9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b", "a"),
        make("09d27a15bcbab5da828d84dbd66062e5d37049f9b165a65dc581e853", "ab"),
        make("e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf", "abc"),
        make("dd886b5fd8421fb3871d24e39e53967ce4fc80dd348bedbea0109c0e", "abcd"),
        make("6acfaab70afd8439cea3616b41088bd81c939b272548f6409cf30e57", "abcde"),
        make("ceb3f4cd85af081120bf69ecf76bf61232bd5d810866f0eca3c8907d", "abcdef"),
        make("8a00ff4ec6b96377f1e69b2f72ed3c8da4bfe2f2f8357dc2aac13433", "abcdefg"),
        make("48bf2e8640cffe77b67c6182a6a47f8b5af73f60bd204ef348371d03", "abcdefgh"),
        make("e7b4cd92a5ab3abc2c08841d0f6aa49f88f9f39be40b5a104dd0f114", "abcdefghi"),
        make("354994394a8f8f8228e8eb447f54dbe52dbdf0a96ab1febdf51417e5", "abcdefghij"),
        make("42e169df4ebe0e5f3a9fcf97dfbda432a2caede22dd662473d09378d", "Discard medicine more than two years old."),
        make("c9e1ca5f838ed55352cda8a203d425e8b5b31187a2228cfd1971bd5d", "He who has a shady past knows that nice guys finish last."),
        make("f657781a2da736a9ef86ed1168658042b8cc23e03dceb518ccf0dacb", "I wouldn't marry him with a ten foot pole."),
        make("8d80a4fabea0b4d83567468fea8c8809aa15f69f672cc84d56a14f18", "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave"),
        make("6a41b37f9c32e82ec32c65648610bb753256a526ad41be5691daafe9", "The days of the digital watch are numbered.  -Tom Stoppard"),
        make("9ef630a116a1fe0292dec2f0ae0a174a850d00d7cef2d5502fa70698", "Nepal premier won't resign."),
        make("9e8519c9920ecff311e2f173ec6d62cd8f81cb3a992a0475c6725fb2", "For every action there is an equal and opposite government program."),
        make("12081c58bff6a2c5823f167897e961335915c2657df41caa0071e563", "His money is twice tainted: 'taint yours and 'taint mine."),
        make("6000aab4424c1d7b4b426bceb0f1d9645d5d4630105aa604730ad156", "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977"),
        make("9c492ee77b6cb07f0aac2c10c0237095f4f45a597301dc21759ecd55", "It's a tiny change to the code and not completely disgusting. - Bob Manchek"),
        make("6114452873116bcbc66fd73fb23defbbc4d680f2486a67cafa6ac33b", "size:  a.out:  bad magic"),
        make("2a1576bddd4dcb2573d0b8662e12920b6d72fff7c842dc6e7d7eea5b", "The major problem is with sendmail.  -Mark Horton"),
        make("f85bf3715fdef0afd976db07df073aecdf2f19917f16b59bbf41bd75", "Give me a rock, paper and scissors and I will move the world.  CCFestoon"),
        make("c3aef36b6774f0ee1f7efba6a3ff10f217915086c5156bff2631a986", "If the enemy is within range, then so are you."),
        make("1465cc7fe34bda12d0b60d2d114b6ed48b2a8b07ca7dcfafe4cfd118", "It's well we cannot hear the screams/That we create in others' dreams."),
        make("13fcda6ce641fba76e5e19cfb3f6dc29412aad3e0e53b7364058b3d2", "You remind me of a TV show, but that's all right: I watch it anyway."),
        make("2e243b3f2f3b45a3900f19605cf357574dacf7c70e2820ecaa9d2e50", "C is as portable as Stonehedge!!"),
        make("5f21880b60d7e78faca18b97bff9bb32c1d83787870470d7cc5e96e5", "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley"),
        make("4a628c1adce02899d2a721620deba82178588ae1314bd3d48c13eed9", "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule"),
        make("b4a355f38a2b188b2a5671c908f942add52cff8929f1e616326c2b22", "How can you write a big system without C++?  -Paul Glick"),
    ]
    doTest(assert, tests,
        'sha3_224', SHA3_224, new SHA3_224(),
        144, 28,
    )
})