import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import { Quad } from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { walker_recursive_sync } from '../Helper/walker'
import { Gql_Generator } from './processRdf'
import { Optional_Class_Mapping_constructorI, Erasable_Property_Mapping_constructor, Property_Mapping_constructor, Class_Mapping_constructorI } from '../Type/Mapping'
import * as stream from 'stream/promises'
dotenv.config()

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

    writeMappings() {
        const mappings = this.mapping_templater()
        fs.writeFileSync(<string>process.env[RDFserializer_service.GENERATED_MAPPINGS_KEY], yaml.dump({ Specific: mappings }), { encoding: "utf-8" })
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

    shortener_property(uri: string) {
        const shorten_pass = this.shortener(uri)
        if (shorten_pass.startsWith("has")) {
            
        }
    }

    array_unifier<T>(an_array: T[]) {
        const unique_dict: {[hash: string] : T} = {}
        for (let value of an_array) {
            unique_dict[JSON.stringify(value)] = value
        }
        return Object.values(unique_dict)
    }

    mapping_templater() {
        const mappings: Optional_Class_Mapping_constructorI[] = []
        // Iterate over all concept
        let concepts = Object.values(this.RDF_handler.gql_resources_preprocesing).filter(resource => resource.isConcept && !resource.isAbstract)
        // Separate the owl:restriction
        let restrictions = Object.values(this.RDF_handler.gql_resources_preprocesing).filter(resource => {
            return resource.isAbstract && resource.class_uri == this.RDF_handler.expender("owl:Restriction")
        })
        for (let concept of concepts) {
            console.log("concept.name")
            console.log(concept.name)
            let entry: Class_Mapping_constructorI = {
                key: this.shortener(concept.class_uri),
                data_properties: [],
                object_properties: []
            };
            (<Erasable_Property_Mapping_constructor[]>entry.object_properties).push(<Erasable_Property_Mapping_constructor>{
                value: concept.class_uri,
                rdf_property: 'rdf:Class'
            })
            // Iterate over properties
            for (let property_uri of concept.properties) {
                const property = this.RDF_handler.gql_resources_preprocesing[property_uri]
                // Skip the property if it is an annotation property
                if (this.RDF_handler.isAnnotationProperty(property)) continue
                (<Erasable_Property_Mapping_constructor[]>entry.object_properties).push(<Erasable_Property_Mapping_constructor>{
                    php_property: concept.class_uri,
                    rdf_property: this.RDF_handler.prefixer(property.class_uri)
                })

            }
            entry.object_properties = this.array_unifier(<Erasable_Property_Mapping_constructor[]>entry.object_properties)
            mappings.push(entry)
        }
        return mappings
    }
}