import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { Context } from './context';

export class ModuleConverter extends AbstractConverter {
    public convert(node: Node, context: Context): Array<YamlModel> {
        node.name = node.name.replace(/"/g, '');
        node.name = node.name.replace(/\//g, '.');

        const uid = context.ParentUid + `.${node.name}`;
        const model: YamlModel = {
            uid: uid,
            name: node.name,
            fullName: node.name + this.getGenericType(node.typeParameter),
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : ''
        };

        this.setSourceInfo(model, node, context.Repo);
        console.log(`${node.kindString}: ${uid}`);

        return [model];
    }
}