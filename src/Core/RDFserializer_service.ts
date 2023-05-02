import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import n3 from "n3"
import { Quad } from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { walker_recursive_sync } from '../Helper/walker'
import { Gql_Generator } from './processRdf'
import * as stream from 'stream/promises'
dotenv.config()

interface MappingI {
    key: string,
    class_uri: string
}
export default class RDFserializer_service {
    private static instance: RDFserializer_service
    static readonly ONTOLOGIES_FOLDER_KEY = "ONTOLOGIES_FOLDER"
    static readonly MAPPINGS_FILE_KEY = "MAPPINGS_FILE"
    static readonly GENERATED_MAPPINGS_KEY = "GENERATED_MAPPING_FILE"

    ontologie_triple: Quad[] = []
    RDF_handler: Gql_Generator = new Gql_Generator()

    private constructor() {
    }

    static async getInstance() {
        if (!this.instance) {
            this.instance = new RDFserializer_service()
            await this.instance.initializeOntologie()
            console.log('after ontologie initialization')

        }
        return this.instance
    }

    private async initializeOntologie() {
        const ontologie_folder_path = <string>process.env[RDFserializer_service.ONTOLOGIES_FOLDER_KEY]
        const ontologie_triple_set: Set<string> = new Set()
        const allParse: Promise<unknown>[] = []
        for (const filename of walker_recursive_sync(ontologie_folder_path)) {
            let contentType = ''
            switch (path.extname(filename)) {
                case '.ttl':
                    contentType = 'text/turtle'
                    break;
                case '.owl':
                case '.rdf':
                    contentType = 'application/rdf+xml'
                    break;

            }
            const parseStream = rdfParser.parse(fs.createReadStream(filename), { contentType: contentType })
                .on('data', (quad: Quad) => {
                    this.RDF_handler.processRdf(quad)
                })
                .on('error', (error) => console.error(error))
                .on('end', () => {
                    console.log('finished ' + filename)

                    // console.log(this.ontologie_triple)
                });
            allParse.push(stream.finished(parseStream))
        }
        await Promise.all(allParse)
        .then((values) => {

        })
        .catch((err) => console.log(err))

        console.log("end of ontologie initialization")
    }

    private initializeMappings() {
        const mapping_file_path = <string>process.env[RDFserializer_service.MAPPINGS_FILE_KEY]
        const file_content = fs.readFileSync(mapping_file_path, { encoding: 'utf-8' })
        console.log(yaml.load(file_content))

        const mappings = this.mapping_templater()
        fs.writeFileSync(<string>process.env[RDFserializer_service.GENERATED_MAPPINGS_KEY], mappings, { encoding: "utf-8" })
    }

    shortener(uri: string) {
        // Extremely permissive url SchemaMetaFieldDef, but lead to error: (^[^#]*[\/#])([^/#]*)$
        const uri_separator = new RegExp(/(^.*[\/#])([\d\w]*)$/gm)
        let matches = uri.matchAll(uri_separator)
        const _array = Array.from(matches)
        console.log(matches)
        if (_array && _array.length > 0) {
            let prefix = _array[0][1]
            if (false) {
                let found_prefix = this.RDF_handler.prefix_handler.getPrefixAndUriFromUri(prefix)
                return found_prefix?.prefix + '__' + _array[0][2]
            } else {
                // console.log(`${uri} is not found`)
                return _array[0][2]
            }
        } else {
            return uri
        }
    }

    mapping_templater() {
        const mappings: MappingI[] = []
        // Iterate over all concept
        let concepts = Object.values(this.RDF_handler.gql_resources_preprocesing).filter(resource => resource.isConcept && !resource.isAbstract)
        // Separate the owl:restriction
        let restrictions = Object.values(this.RDF_handler.gql_resources_preprocesing).filter(resource => {
            return resource.isAbstract && resource.class_uri == this.RDF_handler.expender("owl:Restriction")
        })
        for (let concept of concepts) {
            let entry: MappingI = {
                key: this.shortener(concept.class_uri),
                class_uri: concept.class_uri
            }
            mappings.push(entry)
        }
        return JSON.stringify(mappings, undefined, 2)
    }
}