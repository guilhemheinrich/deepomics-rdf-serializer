import RDFserializer_service from './src/ontology-mapper/ontology-mapper'
import yaml from 'js-yaml'
import * as dotenv from 'dotenv'
import * as fs from 'fs-extra'
dotenv.config()
let juip = {
    async main() {
        const rdf_service = await RDFserializer_service.getInstance()
        fs.writeFileSync('rdf_parsed.json', JSON.stringify(rdf_service.RDF_handler.gql_resources_preprocesing, undefined, 2))
        const mappings = rdf_service.mapping_templater()
        rdf_service.writeMappings()
        console.log("mappings")
        console.log(mappings)
    }
}

juip.main()