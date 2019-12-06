import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { Context } from './context';
import { langs } from '../common/constants';

export class ModuleConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        node.name = node.name.replace(/"/g, '');
        node.name = node.name.replace(/\//g, '.');

        const uid = context.ParentUid + `.${node.name}`;
        const model: YamlModel = {
            uid: uid,
            name: node.name,
            langs: langs,
            fullName: node.name + this.getGenericType(node.typeParameter),
            children: [],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : ''
        };

        console.log(`${node.kindString}: ${uid}`);

        return [model];
    }
}