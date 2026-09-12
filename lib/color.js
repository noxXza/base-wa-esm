import chalk from 'chalk'

export const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

export const bgcolor = (text, bgcolor) => {
    return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text)
}

export const Lognyong = (text, color) => {
    return !color
        ? chalk.yellow('[ ! ] ') + chalk.green(text)
        : chalk.yellow('=> ') + chalk.keyword(color)(text)
}