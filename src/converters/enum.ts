import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { Context } from './context';
import { langs } from '../common/constants';

export class EnumConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        const uid = context.ParentUid + '.' + node.name;
        const model: YamlModel = {
            uid: uid,
            name: node.name,
            children: [],
            langs: langs,
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            type: 'field'
        };

        if (node.defaultValue) {
            model.numericValue = parseInt(node.defaultValue, 10);
        }

        console.log(` - ${node.kindString}: ${uid}`);
        return [model];
    }
}
