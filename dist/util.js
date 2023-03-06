export function camelCase2KebabcCase(variable) {
    return variable.replace(/[A-Z]/g, function (item) {
        return '-' + item.toLowerCase();
    });
}
