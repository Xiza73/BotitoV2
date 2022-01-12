export type ICommand = {
    name: string,
    category: string | null,
    description: string,
    usage: string | null,
    aliases: string[],
    run: Function
}

export type Param = {
    name: string,
    value: string
}