
export function camelCase2KebabcCase(variable: string): string {
    return variable.replace(/[A-Z]/g, function (item) {
        return '-' + item.toLowerCase()
    })
}

