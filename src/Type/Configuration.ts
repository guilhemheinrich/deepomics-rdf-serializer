import { Class_Mapping_constructorI, Optional_Class_Mapping_constructorI } from "./Mapping"

export interface ConfigurationI {
    Prefixes?: {
        key: string
        value: string
    }[]
    Generic: Class_Mapping_constructorI
    Specific?: Optional_Class_Mapping_constructorI[]
}

export interface Optional_ConfigurationI{
    Prefixes?: {
        key: string
        value: string
    }[]
    Specific: Optional_Class_Mapping_constructorI[]
}