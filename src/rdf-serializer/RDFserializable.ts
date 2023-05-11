import { Quad } from "rdf-js"
import { DataFactory } from 'rdf-data-factory';
import RDFserializer_service from "./RDFserializer-service"
import { Dynamic_Property_MappingI, Property_Mapping_constructor, isDynamicProperty, isStaticProperty } from "../Type/Mapping"
import camelize from '../Helper/camelize'
import { DefaultGraph, NamedNode, Writer} from "n3"
// See http://rdf.js.org/data-model-spec/#datafactory-interface
export default class RDFserializable {
    constructor() {

    }

    static isRDFserializable(item: any): item is RDFserializable {
        return item instanceof RDFserializable
    }

    getResourceIdentifier() {
        const rdf_mapper = RDFserializer_service.getInstance()
        const class_mapping = rdf_mapper.getClassMappings(this.constructor.name)
        // return class_mapping.resource_identifier.prefix + camelize(this.constructor.name) + '/' + this[class_mapping.resource_identifier.php_property as keyof this]
        return rdf_mapper.irify(class_mapping.resource_identifier.prefix + camelize(this.constructor.name) + '/' + this[class_mapping.resource_identifier.php_property as keyof this])
    }
    // TODO Factoriser
    RDFserializer() {
        const rdf_mapper = RDFserializer_service.getInstance()
        const class_mapping = rdf_mapper.getClassMappings(this.constructor.name)
        const data_factory = new DataFactory()
        const RDF_serialization: Quad[] = []
        const resource_identifier = this.getResourceIdentifier()

        // Static mapping
        const static_data_properties = class_mapping.data_properties.filter(isStaticProperty)
        const static_object_properties = class_mapping.object_properties.filter(isStaticProperty)
        for (let static_data_property of static_data_properties) {
            const quad = data_factory.quad(
                data_factory.namedNode(rdf_mapper.irify(resource_identifier)),
                data_factory.namedNode(rdf_mapper.irify(static_data_property.rdf_property)),
                data_factory.literal(String(static_data_property.value))
            )
            RDF_serialization.push(quad)
        }
        for (let static_object_property of static_object_properties) {
            const quad = data_factory.quad(
                data_factory.namedNode(rdf_mapper.irify(resource_identifier)),
                data_factory.namedNode(rdf_mapper.irify(static_object_property.rdf_property)),
                data_factory.namedNode(rdf_mapper.irify(String(static_object_property.value)))
            )
            RDF_serialization.push(quad)
        }

        // Dynamic mapping
        const dynamic_data_properties = class_mapping.data_properties.filter(isDynamicProperty)
        const dynamic_object_properties = class_mapping.object_properties.filter(isDynamicProperty)
        for (let property_name of Object.getOwnPropertyNames(this)) {
            // Dynamic data properties
            const matching_data_property = dynamic_data_properties.find((data_property) => data_property.php_property == property_name)
            if (matching_data_property !== undefined && this[matching_data_property.php_property as keyof this] !== undefined) {
                const quad = data_factory.quad(
                    data_factory.namedNode(rdf_mapper.irify(resource_identifier)),
                    data_factory.namedNode(rdf_mapper.irify(matching_data_property.rdf_property)),
                    data_factory.literal(String(this[matching_data_property.php_property as keyof this]))
                )
                RDF_serialization.push(quad)
            }
            // Dynamic object properties
            const matching_object_property = dynamic_object_properties.find((data_property) => data_property.php_property == property_name)
            if (matching_object_property !== undefined && this[matching_object_property.php_property as keyof this] !== undefined) {
                // TODO Récupérer le Resource Identifier de l'objet (et check)
                const targeted_object = this[matching_object_property.php_property as keyof this];
                if (RDFserializable.isRDFserializable(targeted_object)) {
                    const quad = data_factory.quad(
                        data_factory.namedNode(rdf_mapper.irify(resource_identifier)),
                        data_factory.namedNode(rdf_mapper.irify(matching_object_property.rdf_property)),
                        data_factory.namedNode(rdf_mapper.irify(targeted_object.getResourceIdentifier()))
                    )
                    RDF_serialization.push(quad)
                } else {
                    console.error(targeted_object + ' does\'nt seems to be URIfiable')
                }
            }
        }
        return RDF_serialization
    }

    write(format: string = "n3") {
        const rdf_mapper = RDFserializer_service.getInstance()
        const rdf_writter = new Writer({
            prefixes: rdf_mapper.prefixes,
            format: format
        })
        rdf_writter.addQuads(this.RDFserializer())
        let out
        rdf_writter.end((error, result) => out = result);
        return out
    }
}