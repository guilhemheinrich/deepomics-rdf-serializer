import RDFserializer_service from "./src/Core/RDFserializer_service";
import gqlRDF from "./src/Core/processRdf";

let juip = {
    async main() {
        const rdf_service = await RDFserializer_service.getInstance()
        const mappings = rdf_service.mapping_templater()
        console.log("mappings")
        console.log(mappings)
    }
}

juip.main()