import RDFserializer_service from "./src/rdf-serializer/RDFserializer-service";
import Project from "./class_test/Project"
import Coordinator from "./class_test/Coordinator";
import { Writer, BaseFormat} from "n3"
import * as fs from 'fs-extra'
import { Weirdo } from "./class_test/Weirdo";
import path from 'path'

const OUTPUT_BASE_RDF_PATH = './generated/'
const end_of_resource_PATTERN = /^(?!@prefix)(.*\.)$/gm // Check at https://regex101.com ! Awesome resource :)

//    __  __  ____   _____ _  __   _____       _______       
//   |  \/  |/ __ \ / ____| |/ /  |  __ \   /\|__   __|/\    
//   | \  / | |  | | |    | ' /   | |  | | /  \  | |  /  \   
//   | |\/| | |  | | |    |  <    | |  | |/ /\ \ | | / /\ \  
//   | |  | | |__| | |____| . \   | |__| / ____ \| |/ ____ \ 
//   |_|  |_|\____/ \_____|_|\_\  |_____/_/    \_\_/_/    \_\
//                                                           
//         

const project_item = 3
const projects: Project[] = []
const coordinator = new Coordinator(String(0), "Ariane Bize")
for (let i = 0; i < project_item; i++) {
    projects.push(new Project(String(i), "project_" + i, coordinator))
}
projects[0].summary = "This project is trully unbelievable !"

const weirdo = new Weirdo(String("48d45bc4-f00b-11ed-a05b-0242ac120003"), "Charlie")

//   __          _______  _____ _______ ______ 
//   \ \        / /  __ \|_   _|__   __|  ____|
//    \ \  /\  / /| |__) | | |    | |  | |__   
//     \ \/  \/ / |  _  /  | |    | |  |  __|  
//      \  /\  /  | | \ \ _| |_   | |  | |____ 
//       \/  \/   |_|  \_\_____|  |_|  |______|
//                                             
//    



const rdfSerializer_service = RDFserializer_service.getInstance()

const base_format = [
    'Turtle',
    'TriG',
    'N-Triples',
    'N-Quads',
    'N3',
    'Notation3',
]

// Projects & coordinator
let subdir_path = 'deepomics'
for (let format of base_format) {
    let rdf_writer = new Writer({
        prefixes: rdfSerializer_service.prefixes,
        format: <BaseFormat>format
    })

    for (let project of projects) {
        rdf_writer.addQuads(project.RDFserializer())
    }
    rdf_writer.addQuads(coordinator.RDFserializer())
    rdf_writer.end((error, result) => {
        const line_breaked_content = result.replace(end_of_resource_PATTERN, "$1\r\n")
        const targetfile_path = path.join(OUTPUT_BASE_RDF_PATH, subdir_path, 'out.' + format)
        fs.ensureDirSync(path.dirname(targetfile_path))
        fs.writeFileSync(targetfile_path, line_breaked_content)
    });
}

// Weirdo
subdir_path = 'weirdo'

for (let format of base_format) {
    let rdf_writer = new Writer({
        prefixes: rdfSerializer_service.prefixes,
        format: <BaseFormat>format
    })
    rdf_writer.addQuads(weirdo.RDFserializer())
    rdf_writer.end((error, result) => {
        const line_breaked_content = result.replace(end_of_resource_PATTERN, "$1\r\n")
        const targetfile_path = path.join(OUTPUT_BASE_RDF_PATH, subdir_path, 'out.' + format)
        fs.ensureDirSync(path.dirname(targetfile_path))
        fs.writeFileSync(targetfile_path, line_breaked_content)
    });
}