import RDFserializer_service from './src/ontology-mapper/ontology-mapper'
import yaml from 'js-yaml'
import * as dotenv from 'dotenv'
dotenv.config()
let juip = {
    async main() {
        const rdf_service = await RDFserializer_service.getInstance()
        const mappings = rdf_service.mapping_templater()
        rdf_service.writeMappings()
        console.log("mappings")
        console.log(mappings)
    }
}

juip.main()