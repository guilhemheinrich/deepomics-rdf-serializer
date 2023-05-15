import fs from 'fs-extra'
import path from 'path'

// WIth async iterable from https://stackoverflow.com/a/45130990
export async function* walker_recursive(directory:string): AsyncIterable<string> {
    const dirents = await fs.readdir(directory, { withFileTypes: true })
    for (const dirent of dirents) {
        const res = path.resolve(directory, dirent.name);
        if (dirent.isDirectory()) {
          yield* walker_recursive(res);
        } else {
          yield res;
        }
      }
}

export async function* walker(directory:string): AsyncIterable<string> {
    const dirents = await fs.readdir(directory, { withFileTypes: true })
    for (const dirent of dirents) {
        yield path.resolve(directory, dirent.name);
      }
}

export function* walker_recursive_sync(directory:string): Iterable<string> {
    const dirents = fs.readdirSync(directory, { withFileTypes: true })
    for (const dirent of dirents) {
        const res = path.resolve(directory, dirent.name);
        if (dirent.isDirectory()) {
          yield* walker_recursive_sync(<string>res);
        } else {
          yield res;
        }
      }
}

export function* walker_sync(directory:string): Iterable<string> {
    const dirents = fs.readdirSync(directory, { withFileTypes: true })
    for (const dirent of dirents) {
        yield path.resolve(directory, dirent.name);
      }
}