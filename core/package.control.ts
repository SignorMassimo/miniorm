import { red } from 'chalk'

export const RequirePackage = (name: string) => {
    // return true
    try {
        require.resolve(name)
        return true
    } catch (err) {
        console.log(red(`'${name}' is not installed... Please run 'npm i ${name}' command.`))
        process.exit(1)
    }
}