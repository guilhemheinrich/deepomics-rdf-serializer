import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import { Quad } from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { walker_recursive } from '../Helper/walker'

dotenv.config()
export default class RDFserializer_service {
    private static instance: RDFserializer_service
    static readonly ONTOLOGIES_FOLDER_KEY = "ONTOLOGIES_FOLDER"
    static readonly MAPPINGS_FILE_KEY = "MAPPINGS_FILE"

    ontologie_triple: Quad[] = []
    private constructor() {
        this.initializeOntologie()
        console.log('after ontologie initialization')
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new RDFserializer_service()
        }
        return this.instance
    }

    private async initializeOntologie() {
        const ontologie_folder_path = <string>process.env[RDFserializer_service.ONTOLOGIES_FOLDER_KEY]
        const ontologie_triple_set: Set<string> = new Set()
        for await (const filename of walker_recursive(ontologie_folder_path)) {
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
            rdfParser.parse(fs.createReadStream(filename), { contentType: contentType, baseIRI: 'http://example.org' })
            .on('data', (quad: Quad) => {
                // Add a string representation to enforce uniqueness through sameValue comparaison
                ontologie_triple_set.add(JSON.stringify(quad))
            })
            .on('error', (error) => console.error(error))
            .on('end', () => {
                this.ontologie_triple = Array(...ontologie_triple_set).map((string_quad) => JSON.parse(string_quad))
                console.log("end of rdfparsing")
                this.initializeMappings()
                console.log('after mapping initialization')
                // console.log(this.ontologie_triple)
            });
        }
        console.log("end of ontologie initialization")
    }

    private initializeMappings() {
        const mapping_file_path = <string>process.env[RDFserializer_service.MAPPINGS_FILE_KEY]
        const file_content = fs.readFileSync(mapping_file_path, {encoding: 'utf-8'})
        console.log(yaml.load(file_content))
    }
}