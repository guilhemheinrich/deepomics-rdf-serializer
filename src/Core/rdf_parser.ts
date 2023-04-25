import rdfParser from "rdf-parse"
import { Quad } from "rdf-js"
import fs from 'fs-extra'

import { ReadStream, WriteStream } from "fs";
import multiple_file_stream from './multiple_file_reader'   




const OUTPUT_PARSED_ONTOLOGY = __dirname + '/parsed_ontology.txt'
const OUTPUT_MODEL = __dirname + '/output.json'
const OUTPUT_PREFIXES = __dirname + '/computed_prefixes.json'
const OUTPUT_GQL = __dirname + '/output.gql'
const writeStream = fs.createWriteStream(OUTPUT_PARSED_ONTOLOGY);

writeStream.on("finish", () => {
    // console.log(gqlRDF.gql_properties_preprocessing)
})


function consumer(readStream: ReadStream, writeStream: WriteStream) {
    return rdfParser.parse(readStream, { contentType: 'application/rdf+xml', baseIRI: 'http://example.org' })
    .on('data', (quad: Quad) => {
        // data.push(quad)
        writeStream.write(JSON.stringify(quad, undefined, 2))
        writeStream.write('\n')
        // writeStream.write(`${quad.subject.value} ${quad.predicate.value} ${quad.object.value}`)
        writeStream.write('\n\n')
    })
    .on('error', (error) => console.error(error))
    .on('end', () => {
        
    });
}

const ONTOLOGY_OWL = __dirname + '/ontologies/owl.owl'
const ONTOLOGY_FOAF = __dirname + '/ontologies/foaf.rdf'
const ONTOLOGY_OA = __dirname + '/ontologies/oa.rdf'
const ONTOLOGY_OEEV = __dirname + '/ontologies/oeev.owl'
const ONTOLOGY_OESO_CORE = __dirname + '/ontologies/oeso-core.owl'

const ONTOLOGY_SINFONIA = __dirname + '/ontologies/oeso-sinfonia_14.02.22.owl'



multiple_file_stream(consumer, writeStream, ONTOLOGY_OA, ONTOLOGY_OEEV, ONTOLOGY_OESO_CORE, ONTOLOGY_FOAF, ONTOLOGY_SINFONIA)
