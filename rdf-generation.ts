import RDFserializer_service from "./src/rdf-serializer/RDFserializer-service";
import RDFserializable from "./src/rdf-serializer/RDFserializable";
import Project from "./class_test/Project"

const test_item = 1
const projects: Project[] = []
for (let i = 0; i < test_item; i++) {
    projects.push(new Project(String(i), "project_" + i))
}

for (let project of projects) {
    project.templateRDF()
}