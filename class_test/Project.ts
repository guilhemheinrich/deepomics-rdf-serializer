import RDFserializable from "../src/rdf-serializer/RDFserializable";

export default class Project extends RDFserializable {
    id: string
    slug?: string
    
    constructor(id: string, slug?: string) {
        super()
        this.id = id
        this.slug = slug
    }

}