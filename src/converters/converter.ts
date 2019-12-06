import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { ModuleConverter } from './module';
import { AbstractConverter } from './base';
import { EnumConverter } from './enum';
import { PropertyConverter } from './property';
import { AccessorConverter } from './accessor';
import { MethodConverter } from './method';
import { TypeConverter } from './type';
import { Context } from './context';
import { EmptyConverter } from './empty';

export class Converter {
    public convert(node: Node, context: Context): Array<YamlModel> {
        const converter = this.createConverter(node, context.References);
        return converter.convert(node, context);
    }

    private createConverter(node: Node, references: Map<string, string[]>): AbstractConverter {
        switch (node.kindString) {
            case 'Module':
                return new ModuleConverter(references);
            case 'Enumeration member':
                return new EnumConverter(references);
            case 'Property':
                return new PropertyConverter(references);
            case 'Accessor':
                return new AccessorConverter(references);
            case 'Method':
            case 'Function':
            case 'Constructor':
                return new MethodConverter(references);
            case 'Class':
            case 'Interface':
            case 'Enumeration':
            case 'Type alias':
                return new TypeConverter(references);
            default:
                return new EmptyConverter(references);
        }
    }
}