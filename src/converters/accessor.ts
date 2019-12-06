import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { typeToString } from '../idResolver';
import { Context } from './context';

export class AccessorConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        const uid = context.ParentUid + '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        let signatureType;
        if (node.getSignature) {
            if (Array.isArray(node.getSignature)) {
                signatureType = node.getSignature[0].type;
            } else {
                signatureType = node.getSignature.type;
            }
        } else if (node.setSignature) {
            if (Array.isArray(node.setSignature)) {
                signatureType = node.setSignature[0].type;
            } else {
                signatureType = node.setSignature.type;
            }
        }

        const model: YamlModel = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: 'property',
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            syntax: {
                content: `${node.flags && node.flags.isStatic ? 'static ' : ''}${typeToString(this.extractType(signatureType)[0])} ${node.name}`,
                return: {
                    type: this.extractType(signatureType),
                    description: this.extractReturnComment(node.comment)
                }
            }
        };

        return [model];
    }
}
