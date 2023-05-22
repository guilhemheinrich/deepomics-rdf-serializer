import * as dotenv from 'dotenv'
import rdfParser from "rdf-parse"
import n3 from "n3"
import { Quad } from "rdf-js"
import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { walker_recursive_sync } from '../Helper/walker'
import array_unifier from '../Helper/array_unifier'
import { Class_MappingI, Class_Mapping_constructorI, Erasable_Property_Mapping_constructor, Optional_Class_Mapping_constructorI, Property_Mapping_constructor } from '../Type/Mapping'
import { ConfigurationI, Optional_ConfigurationI } from '../Type/Configuration'
dotenv.config()


class Mapping_Dictionary {
    [php_class_name: string]: Class_MappingI
    constructor(generic_constructor: Class_MappingI) {
        const handler = {
            get: function (target: Mapping_Dictionary, prop: string) {
                if (!Object.keys(target).includes(prop)) {
                    target[prop] = {
                        key: prop,                // Initialize with the uri
                        resource_identifier: {
                            php_property: generic_constructor.resource_identifier.php_property ?? 'id',
                            prefix: generic_constructor.resource_identifier.prefix ?? ''
                        },
                        data_properties: generic_constructor.data_properties ?? [],
                        object_properties: generic_constructor.object_properties ?? [],
                        inherits: generic_constructor.inherits ?? new Set<string>()
                    }
                }
                return Reflect.get(target, prop)
            }
        }
        return new Proxy(this, handler)
    }
}


export default class RDFserializer_service {
    private static instance: RDFserializer_service
    readonly mapping_dictionary: Mapping_Dictionary
    readonly prefixes: {
        [prefix: string]: string
    } = {}
    static readonly MAPPINGS_FILE_KEY = "MAPPINGS_FILE"
    static readonly GENERATED_MAPPINGS_KEY = "GENERATED_MAPPING_FILE"

    private constructor() {
        const generated_mapping_path = <string>process.env[RDFserializer_service.GENERATED_MAPPINGS_KEY]
        const custom_mapping_path = <string>process.env[RDFserializer_service.MAPPINGS_FILE_KEY]


        // Read custom configuration
        let file_content = fs.readFileSync(custom_mapping_path, { encoding: 'utf-8' })
        const core_configuration = <ConfigurationI>yaml.load(file_content)
        // Read optional configuration
        file_content = fs.readFileSync(generated_mapping_path, { encoding: 'utf-8' })
        const generated_configuration = <Optional_ConfigurationI>yaml.load(file_content)


        // Get the prefixes array
        if (generated_configuration?.Prefixes) {
            for (let prefix_entry of generated_configuration.Prefixes) {
                this.prefixes[prefix_entry.key] = prefix_entry.value
                // this.prefixes.add(JSON.stringify(prefix_entry))
            }
        }
        if (core_configuration?.Prefixes) {
            for (let prefix_entry of core_configuration.Prefixes) {
                // this.prefixes.add(JSON.stringify(prefix_entry))
                this.prefixes[prefix_entry.key] = prefix_entry.value
            }
        }
        // Build the generic configuration
        const generic: Class_MappingI = {
            key: core_configuration.Generic.key ?? '',
            resource_identifier: {
                php_property: core_configuration.Generic.resource_identifier?.php_property ?? 'id',
                prefix: core_configuration.Generic.resource_identifier?.prefix ?? ''
            },
            data_properties: core_configuration.Generic.data_properties ?? [],
            object_properties: core_configuration.Generic.object_properties ?? [],
            inherits: core_configuration.Generic.inherits ?? new Set<string>(),
        }
        this.mapping_dictionary = new Mapping_Dictionary(generic)
        // Iterate over the generated mappings
        for (let generated_class_mapping of (generated_configuration?.Specific ?? [])) {
            this._handle_class_mapping_constructor(generated_class_mapping)
        }
        // Then iterate over the more specific ones
        for (let custom_class_mapping of (core_configuration?.Specific ?? [])) {
            this._handle_class_mapping_constructor(custom_class_mapping)
        }
        // Uniquify
        for (let class_mapping of Object.values(this.mapping_dictionary)) {
            class_mapping.data_properties = array_unifier(class_mapping.data_properties)
            class_mapping.object_properties = array_unifier(class_mapping.object_properties)
        }
    }

    private _handle_class_mapping_constructor(class_mapping_contructor: Optional_Class_Mapping_constructorI) {
        const mapping: Class_MappingI = this.mapping_dictionary[class_mapping_contructor.key]
        // If we want to delete an old class mapping
        if (class_mapping_contructor.erase) {
            delete this.mapping_dictionary[class_mapping_contructor.key]
            return
        }
        // Properly deepcopy JSON
        const new_mapping = JSON.parse(JSON.stringify(mapping))

        if (class_mapping_contructor.resource_identifier?.php_property) {
            new_mapping.resource_identifier.php_property = class_mapping_contructor.resource_identifier.php_property
        }
        if (class_mapping_contructor.resource_identifier?.prefix) {
            new_mapping.resource_identifier.prefix = class_mapping_contructor.resource_identifier.prefix
        }

        for (let data_property of (class_mapping_contructor.data_properties ?? [])) {
            this._handle_property_mapping_constructor(data_property, new_mapping.data_properties)
        }

        for (let object_property of (class_mapping_contructor.object_properties ?? [])) {
            this._handle_property_mapping_constructor(object_property, new_mapping.object_properties)
        }
        console.log(new_mapping.data_properties)
        if (class_mapping_contructor.inherits) class_mapping_contructor.inherits.forEach((class_key) => new_mapping.inherits.add(class_key))
        this.mapping_dictionary[class_mapping_contructor.key] = new_mapping
    }

    private _handle_property_mapping_constructor(optional_property_constructor: Erasable_Property_Mapping_constructor, properties: Array<Property_Mapping_constructor>) {
        // If we want to delete an old property mapping
        if (optional_property_constructor.erase) {
            const deletable_property_mapping_index = properties.findIndex((property_mapping) => {
                if ('php_property' in property_mapping && 'php_property' in optional_property_constructor) {
                    return property_mapping.php_property == optional_property_constructor.php_property && property_mapping.rdf_property == optional_property_constructor.rdf_property
                } else if ('value' in property_mapping && 'value' in optional_property_constructor) {
                    return property_mapping.value == optional_property_constructor.value && property_mapping.rdf_property == optional_property_constructor.rdf_property

                }
            })
            if (deletable_property_mapping_index != -1) properties.splice(deletable_property_mapping_index)
        } else {
            if ('php_property' in optional_property_constructor) {
                properties.push({
                    php_property: optional_property_constructor.php_property,
                    rdf_property: optional_property_constructor.rdf_property
                })
            } else {
                properties.push({
                    value: optional_property_constructor.value,
                    rdf_property: optional_property_constructor.rdf_property
                })
            }
        }
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new RDFserializer_service()
        }
        return this.instance
    }

    irify(prefixed_or_uri: string) {

        for (let prefix in this.prefixes) {
            const value = this.prefixes[prefix]
            if (prefixed_or_uri.startsWith(prefix + ':')) {
                return value + prefixed_or_uri.slice(prefix.length + 1)
            }
        }
        return prefixed_or_uri
    }

    prefixify(prefixed_or_uri : string) {
        for (let prefix in this.prefixes) {
            const value = this.prefixes[prefix]
            if (prefixed_or_uri.startsWith(value)) {
                return prefix + ':' + prefixed_or_uri.slice(value.length)
            }
        }
        return prefixed_or_uri
    }
    getClassMappings(class_key: string) {
        return this.mapping_dictionary[class_key]
    }
}