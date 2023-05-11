import RDFserializable from "../src/rdf-serializer/RDFserializable";

export class Weirdo extends RDFserializable{
    uuid: string
    name?: string

    constructor(uuid: string, name?: string) {
        super()
        this.uuid = uuid
        this.name = name

    }
}