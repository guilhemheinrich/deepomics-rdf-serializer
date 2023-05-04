export interface ErasableI {
    erase?: boolean
}

export interface Class_MappingI {
    key: string
    resource_identifier: {
        php_property: string
        prefix: string
    }
    data_properties: Array<Dynamic_Property_MappingI|Static_Property_MappingI>
    object_properties: Array<Dynamic_Property_MappingI|Static_Property_MappingI>
    inherits: Set<string>
}

export function isDynamicProperty(property: Property_Mapping_constructor) : property is Dynamic_Property_MappingI {
    if ("php_property" in property) return true
    return false
}
export function isStaticProperty(property: Property_Mapping_constructor) : property is Static_Property_MappingI {
    if ("value" in property) return true
    return false
}
export interface RDFProperty_mappingI {
    rdf_property: string
}

export interface Dynamic_Property_MappingI extends RDFProperty_mappingI {
    php_property: string
}

export interface Static_Property_MappingI extends RDFProperty_mappingI {
    value: string | number
}

// export type Dynamic_Property_Mapping_constructor = Dynamic_Property_MappingI & ErasableI
// export type Static_Property_Mapping_constructor = Static_Property_MappingI & ErasableI
export type Property_Mapping_constructor = Dynamic_Property_MappingI | Static_Property_MappingI
export type Erasable_Property_Mapping_constructor = Property_Mapping_constructor & ErasableI
export type Optional_Class_Mapping_constructorI = Class_Mapping_constructorI & ErasableI

export interface Class_Mapping_constructorI {
    key: string
    resource_identifier?: {
        php_property?: string
        prefix?: string
    }
    data_properties?: Array<Dynamic_Property_MappingI|Static_Property_MappingI>
    object_properties?: Array<Dynamic_Property_MappingI|Static_Property_MappingI>
    inherits?: Set<string>
}


export class Class_Mapping implements Class_MappingI {
    key: string = ''
    resource_identifier: {
        php_property: string
        prefix: string
    } = {
        php_property: '',
            prefix: ''
        }

    data_properties: Array<Dynamic_Property_MappingI|Static_Property_MappingI> = []
    object_properties: Array<Dynamic_Property_MappingI|Static_Property_MappingI> = []
    inherits: Set<string> = new Set<string>()
    constructor(class_mapping_constructor: Class_Mapping_constructorI) {
        this.key = class_mapping_constructor.key
        if (class_mapping_constructor.resource_identifier !== undefined) {
            this.resource_identifier.php_property = class_mapping_constructor.resource_identifier.php_property ?  class_mapping_constructor.resource_identifier.php_property : ''
            this.resource_identifier.prefix = class_mapping_constructor.resource_identifier.prefix ?  class_mapping_constructor.resource_identifier.prefix : ''
        }

        this.data_properties = class_mapping_constructor.data_properties ? class_mapping_constructor.data_properties : []
        this.object_properties = class_mapping_constructor.object_properties ? class_mapping_constructor.object_properties : []
        if (class_mapping_constructor.inherits) class_mapping_constructor.inherits.forEach((class_key) => this.inherits.add(class_key))
    }
}