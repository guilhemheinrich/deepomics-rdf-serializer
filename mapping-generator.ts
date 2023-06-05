import * as commander from 'commander'
import * as path from 'path';
import * as fs from 'fs-extra'
import RDFserializer_service from './src/ontology-mapper/ontology-mapper'
import * as dotenv from 'dotenv'

const cli = new commander.Command()
const BASE_CALL_DIR = process.cwd()
let root_output_path: string;
let root_input_path: string;
let prefixes_array: string[] = [];
dotenv.config()

export const module = {
    async execute(ontologies_folder_key: string, generated_mapping_path: string) {
        console.log(ontologies_folder_key)
        console.log(generated_mapping_path)
        const rdf_service = await RDFserializer_service.getInstance(ontologies_folder_key)
        fs.ensureDirSync(path.dirname(generated_mapping_path))
        rdf_service.writeMappings(generated_mapping_path)
    }
}
cli
    .description('Scan a file or a folder, and generate a mapping file to use with a Synfony instance (See @rdf-serializer - link) using OWL semantics')
    .option('-s --ontologies_folder_key <string>', 'Path to the resource containing semantized data (folder or file)')
    .option('-d --generated_mapping_file <string>', 'Destination path of the generated path')
    // TODO Handle prefixes
    .option("-p --prefixes <string>", 'Path to a JSON file containing an array of the form: {"uri": uri, "prefix": prefix}')
    .action((cmdObj) => {
        // path from the input
        root_input_path = path.resolve(BASE_CALL_DIR, cmdObj.ontologies_folder_key ?? <string>process.env["ONTOLOGIES_FOLDER"] ?? ".")
        root_output_path = path.resolve(BASE_CALL_DIR, cmdObj.generated_mapping_file ?? <string>process.env["GENERATED_MAPPING_FILE"]?? "generated.yaml")
        console.log(`
ontologies path: ${root_input_path}
generated mappings path: ${root_output_path}
prefixes array path: ${prefixes_array}
        `)
        module.execute(root_input_path, root_output_path)
    })

cli.parse(process.argv)

