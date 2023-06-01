/// <reference lib="es2018.regexp" />

import path from 'path'
import fs from 'fs-extra'

type prefix_array = {prefix: string, uri: string}[]
export class Prefixer {
    prefix_array: prefix_array = []
    private undefined_cpt = 0
    private uri_separator = new RegExp(/^(?<protocol>\w*:\/\/)?(?<path>.*)(?<separator>[\/#])(?<fragment>.*)$/gm)
    private uninteresting_string = [
        'core',
        'www',
        'org',
        'com'
    ]
    constructor(prefix_files: string[] = []) {
        for (let _path of prefix_files) {
            let JSON_content: prefix_array = []
            try {
                JSON_content = JSON.parse(fs.readFileSync(_path, 'utf-8'))
                if (!Array.isArray(JSON_content)) {
                    console.debug(`${_path} is not an array`)
                } else {
                    for (let uri_prefix of JSON_content) {
                        try {
                            let prefix_match = this.prefix_array.find((_uri_prefix) => {
                                _uri_prefix.prefix == uri_prefix.prefix
                            })
                            let uri_match = this.prefix_array.find((_uri_prefix) => {
                                _uri_prefix.uri == uri_prefix.uri
                            })
                            if (uri_match) {
                                console.debug(`${uri_prefix.uri} already exists, and the prefix in ${_path} doesn't match with the existing one`)
                                console.debug(`Existing uri is ${uri_match.uri}`)
                                console.debug(`New uri is ${uri_match.uri}`)
                                console.debug(`No prefix/uri has been added !`)
                                continue
                            } 
                            if (prefix_match) {
                                if (prefix_match.uri != uri_prefix.uri) {
                                    console.debug(`${uri_prefix.prefix} already exists, and the uri in ${_path} doesn't match with the existing one`)
                                    console.debug(`Existing uri is ${prefix_match.uri}`)
                                    console.debug(`New uri is ${prefix_match.uri}`)
                                    console.debug(`No prefix/uri has been added !`)
                                } else {
                                    console.debug(`${uri_prefix.prefix} already exists, and the uris match`)
                                    console.debug(`No prefix/uri has been added !`)
                                }
                            
                            } else {
                                this.prefix_array.push({
                                    uri: uri_prefix.uri,
                                    prefix: uri_prefix.prefix
                                })
                            }
                        } catch (error) {
                            console.debug('An error occured')
                            console.debug(error)
                        }
                    }
                }
            } catch (error) {
                console.debug(`${_path} is not a valid JSON file`)
            }
        }
    }

    getPrefixAndUriFromPrefix(prefix: string) {
        return this.prefix_array.find((value) => value.prefix == prefix)
    }

    getPrefixAndUriFromUri(uri: string) {
        // First try to find the prefix in already existing uri list
        for (let prefix_uri of this.prefix_array) {
            if (uri.startsWith(prefix_uri.uri)) {
                // console.log('found prefix! ' + prefix_uri.prefix)
                return prefix_uri
            }
        }
        // console.log('Did not found prefix for ' + uri)
        // Else create a new prefix and return it
        // let matches = uri.matchAll(uri_separator)
        // let plop = uri.match(uri_separator)
        this.uri_separator.lastIndex = 0;
        let _match = this.uri_separator.exec(uri)
        // let _array = Array.from(matches)
        if (_match) {
            let sub_uri = _match!.groups!.protocol + _match!.groups!.path +_match!.groups!.separator
            let propositions = _match!.groups!.path.split(/[^\w\d]/)  
            let prefix = this.buildPrefixFromProposition(propositions)
            console.log('Found a new possible prefix ! ' + prefix)
            let new_prefix_uri = {
                uri: sub_uri,
                prefix: prefix
            }
            this.prefix_array.push(new_prefix_uri)
            return new_prefix_uri
        } else {
            console.debug(`${uri} is not a valid uri according to the pattern ${this.uri_separator}`)
        }
        // So the compilator does'nt ennoy us, and a potential weird result is "easily" spottable
        return {
            uri: uri,
            prefix: uri
        }
    }

    buildPrefixFromProposition(propositions: ReadonlyArray<string>): string {
        return propositions.map((prop) => prop.toLowerCase()).filter((prop_low) => !this.uninteresting_string.includes(prop_low)).join('_')
        let number_memory: string[] = []
        // slice is used to copy the array first, as the reverse() method mutate the intial array too
        for (let proposition of propositions.slice().reverse()) {
            if (!proposition ) continue // Skip if it's empty
            if (this.uninteresting_string.includes(proposition)) continue // Skip If uninformative
            if (proposition.match(/\d*/)) {
                number_memory.push(<string>proposition)
                continue
            }
            return proposition.toLowerCase() + number_memory.join('_') // return the more righ fragment otherwise, followed by the "numbers" founded
        }
        let undefined_index = 'undefined_ns_' + this.undefined_cpt
        this.undefined_cpt++
        return undefined_index
    }

    // TODO
    // extract the prefix as a Cypher n10s prefix list
    to_n10s_prefixes_option() {

    }
}

export default Prefixer
