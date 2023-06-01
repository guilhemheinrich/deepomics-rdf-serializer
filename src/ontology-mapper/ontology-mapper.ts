import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import { Quad } from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { walker_recursive_sync } from '../Helper/walker'
import camelize from '../Helper/camelize'
import array_unifier from '../Helper/array_unifier'
import { Gql_Generator } from './processRdf'
import { Optional_Class_Mapping_constructorI, Erasable_Property_Mapping_constructor, Property_Mapping_constructor, Class_Mapping_constructorI } from '../Type/Mapping'
import * as stream from 'stream/promises'
import { NamedNode } from 'n3'
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
            await this.instance.initializePrefixes()
            await this.instance.initializeOntologie()
        }
        return this.instance
    }

    private async initializePrefixes() {
        const ontologie_folder_path = <string>process.env[RDFserializer_service.ONTOLOGIES_FOLDER_KEY]
        const prefixParse: Promise<unknown>[] = []
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
                default:
                    continue

            }
            const prefixStream = rdfParser.parse(fs.createReadStream(filename), { contentType: contentType })
                .on('prefix', (prefix: string, iri: NamedNode) => {
                    console.log('Read prefix ' + prefix)
                    this.RDF_handler.prefix_handler.prefix_array.push({
                        uri: iri.id,
                        prefix: prefix
                    })
                })
                .on('data', () => { })
                .on('error', (error) => console.error(error))
                .on('end', () => {
                    console.log('finished reading prefixes from ' + filename)
                });
            prefixParse.push(stream.finished(prefixStream))
        }

        return Promise.all(prefixParse)
        .then((values) => {
            console.log(values)
            // return Promise.all(allParse)
            //     .then((values) => {

            //     })
            //     .catch((err) => console.log(err))
            console.log(this.RDF_handler.prefix_handler.prefix_array)
        })
        .catch((err) => console.log(err))
    }

    private async initializeOntologie() {
        const ontologie_folder_path = <string>process.env[RDFserializer_service.ONTOLOGIES_FOLDER_KEY]
        // const prefixParse: Promise<unknown>[] = []
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
                default:
                    continue

            }

            const parseStream = rdfParser.parse(fs.createReadStream(filename), { contentType: contentType })
                .on('data', (quad: Quad) => {
                    this.RDF_handler.processRdf(quad)
                })
                .on('error', (error) => console.error(error))
                .on('end', () => {
                    console.log('finished reading quad from ' + filename)

                });
            allParse.push(stream.finished(parseStream))
        }
        return Promise.all(allParse)
            .then((values) => {

            })
            .catch((err) => console.log(err))
    }

    writeMappings() {
        const mappings = this.mapping_templater()
        const prefixes = this.prefixes_templater()
        fs.writeFileSync(<string>process.env[RDFserializer_service.GENERATED_MAPPINGS_KEY], yaml.dump({ Prefixes: prefixes, Specific: mappings }), { encoding: "utf-8" })
    }

    shortener(uri: string) {
        // Extremely permissive url SchemaMetaFieldDef, but lead to error: (^[^#]*[\/#])([^/#]*)$
        const uri_separator = new RegExp(/(^.*[\/#])([\d\w]*)$/gm)
        let matches = uri.matchAll(uri_separator)
        const _array = Array.from(matches)
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

    shortener_property(uri: string): string {
        const shorten_pass = this.shortener(uri)
        if (shorten_pass.startsWith("has")) {
            return camelize(shorten_pass.slice(3))
        }
        return shorten_pass
    }

    mapping_templater() {
        const mappings: Optional_Class_Mapping_constructorI[] = []
        // Iterate over all concept
        let concepts = Object.values(this.RDF_handler.gql_resources_preprocesing).filter(resource => resource.isConcept && !resource.isAbstract)
        
        for (let concept of concepts) {
            let entry: Class_Mapping_constructorI = {
                key: this.shortener(concept.class_uri),
                data_properties: [],
                object_properties: []
            };
            (<Erasable_Property_Mapping_constructor[]>entry.object_properties).push(<Erasable_Property_Mapping_constructor>{
                value: concept.class_uri,
                rdf_property: 'rdf:Class'
            })
            const restrictions = this.RDF_handler.getRestrictions(concept.class_uri)
            // Iterate over properties
            const all_properties = this.RDF_handler.getInheritedValues(concept.class_uri, "properties")
                .reduce((acculmulator, value) => {
                    return [...acculmulator, ...value]
                }, [])
            for (let property_uri of all_properties) {
                
                // * Deep copy property then walk through restrictions to update
                const property: typeof this.RDF_handler.gql_resources_preprocesing[typeof property_uri] = JSON.parse(JSON.stringify(this.RDF_handler.gql_resources_preprocesing[property_uri]))
                // Skip the property if it is an annotation property
                if (this.RDF_handler.isAnnotationProperty(property)) continue
                //Filter restrictions applying to the current property
                const relevant_restrictions = restrictions.filter((restriction) => {
                    return restriction.property_uri == property_uri
                })
                for (let relevant_restriction of relevant_restrictions) {
                    // * Doesn't enforce VALIDATION of owl rules
                    // * It means that no output will be generated if we got two contrary rules 
                    property.isList = relevant_restriction.isList
                    property.isRequired = relevant_restriction.isRequired
                    console.log('Found restriction on property ' + property.name + ' on class ' + concept.name)
                }
                if (this.RDF_handler.isDatatypeProperty(property)) {
                    console.log(property_uri + " is a datatype property" + (property.isList ? ' and a list' : ''));

                    (<Erasable_Property_Mapping_constructor[]>entry.data_properties).push(<Erasable_Property_Mapping_constructor>{
                        php_property: this.shortener_property(property.class_uri) + (property.isList ? 's' : ''),
                        rdf_property: this.RDF_handler.prefixer(property.class_uri)
                    })
                } else {
                    console.log(property_uri + " is an object property" + (property.isList ? ' and a list' : ''));
                    (<Erasable_Property_Mapping_constructor[]>entry.object_properties).push(<Erasable_Property_Mapping_constructor>{
                        php_property: this.shortener_property(property.class_uri) + (property.isList ? 's' : ''),
                        rdf_property: this.RDF_handler.prefixer(property.class_uri)
                    })
                }

            }
            entry.object_properties = array_unifier(<Erasable_Property_Mapping_constructor[]>entry.object_properties)
            mappings.push(entry)
        }
        return mappings
    }

    prefixes_templater() {
        return array_unifier(this.RDF_handler.prefix_handler.prefix_array).map((prefix_entry) => {
            return {
                key: prefix_entry.prefix,
                value: prefix_entry.uri
            }
        })
    }
}