import RDFserializable from "../src/rdf-serializer/RDFserializable";
import Coordinator from "./Coordinator";

export default class Project extends RDFserializable {
    id: string
    slug?: string
    coordinator?: Coordinator
    summary?: string
    
    constructor(id: string, slug?: string, coordinator?: Coordinator) {
        super()
        this.id = id
        this.slug = slug
        this.coordinator = coordinator
    }

}