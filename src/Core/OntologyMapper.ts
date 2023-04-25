import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import { Quad, Quad_Subject, Quad_Predicate, Quad_Object} from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import { walker_recursive_sync } from '../Helper/walker'
import { ReadStream, WriteStream } from "fs";
import multiple_file_stream from './multiple_file_reader'   


dotenv.config()
const ONTOLOGIES_FOLDER_KEY = "ONTOLOGIES_FOLDER"
const GENERATED_MAPPINGS_KEY = "GENERATED_MAPPING_FILE"
const ontologie_folder_path = <string>process.env[ONTOLOGIES_FOLDER_KEY]
const generated_mappings_path = <string>process.env[GENERATED_MAPPINGS_KEY]
const ontologie_triple: Array<Triple> = new Array()
const ontologie_triple_set: Set<string> = new Set()

interface Triple {
    subject: Quad_Subject,
    predicate: Quad_Predicate,
    object: Quad_Object
}


const writeStream = fs.createWriteStream(generated_mappings_path);
writeStream.on("finish", () => {
    // console.log(gqlRDF.gql_properties_preprocessing)
    ontologie_triple.push(...Array(...ontologie_triple_set).map((string_quad) => JSON.parse(string_quad)))
    fs.writeFileSync(generated_mappings_path, JSON.stringify(ontologie_triple, undefined, 2))
})


function consumer(readStream: ReadStream, writeStream: WriteStream) {
    const source_path = <string>readStream.path
    let contentType = ''
    switch (path.extname(source_path)) {
        case '.ttl':
        contentType = 'text/turtle'
        break;
        case '.owl':
        case '.rdf':
        contentType = 'application/rdf+xml'
        break;
        
    }
    return rdfParser.parse(readStream, { contentType: contentType, baseIRI: 'http://example.org' })
    .on('data', (quad: Quad) => {
        
        // TODO Mieux gérer les blank node
        //* Non bloquant pour l'instant
        const triple = {   
            subject: quad.subject,
            predicate: quad.predicate,
            object: quad.object
        }
        ontologie_triple_set.add(JSON.stringify(triple))
    })
    .on('error', (error) => console.error(error))
    .on('end', () => {
        
    });
}


multiple_file_stream(consumer, writeStream, ...walker_recursive_sync(ontologie_folder_path))

function generate_mappings(triple_array: Triple[]) {
    
}