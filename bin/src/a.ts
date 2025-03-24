import * as os from "ejs/os";
import * as sync from "ejs/sync";

// Start a coroutine
sync.go((co) => {
    
    // Create a temporary file
    const f = os.File.createTemp(co, "ejs_temp_*")
    const name = f.name()
    console.log(`create success: ${name}`)
    try {
        // write then close
        f.write(co, 'this is a coroutine example')
        f.close()

        // read text file
        const text = os.readTextFile(co, name)
        console.log(text)
    } catch (e) {
        console.log(`err: ${e}`)
    }
    // remove
    os.remove(co, name)
})
os.stat