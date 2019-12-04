import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { Context } from './context';

export class EmptyConverter extends AbstractConverter {
    public convert(node: Node, context: Context): Array<YamlModel> {
        return [];
    }
}
