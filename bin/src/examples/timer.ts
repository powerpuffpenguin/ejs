import { Command } from "../flags";
export const command = new Command({
    use: 'timer',
    short: 'timer example',
    run: () => {
        setTimeout(() => {
            let i = 0
            let timer = setInterval(() => {
                console.log('interval_0', i++)
                if (i == 5) {
                    clearInterval(timer)

                    timer = setInterval(() => {
                        console.log('interval_1', i++)
                    }, 1000)
                    const timeout = setTimeout(() => {
                        console.log("nerver")
                    }, 10 * 1000);
                    setTimeout(() => {
                        console.log("end")
                    }, 6 * 1000);
                    setTimeout(() => {
                        clearInterval(timer)
                        clearTimeout(timeout)
                    }, 5.5 * 1000)
                }
            }, 0)
        }, 0)
    }
})