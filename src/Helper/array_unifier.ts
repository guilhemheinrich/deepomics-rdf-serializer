export default function array_unifier<T>(an_array: T[]) {
    const unique_dict: {[hash: string] : T} = {}
    for (let value of an_array) {
        unique_dict[JSON.stringify(value)] = value
    }
    return Object.values(unique_dict)
}