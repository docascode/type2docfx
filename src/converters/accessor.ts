import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { typeToString } from '../idResolver';
import { Context } from './context';
import { langs } from '../common/constants';

export class AccessorConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        const uid = context.ParentUid + '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        let signatureTypeGet;
        let signatureTypeGetBody;
        let signatureTypeSet;
        let signatureTypeSetBody;
        if (node.getSignature) {
            if (Array.isArray(node.getSignature)) {
                signatureTypeGet = node.getSignature[0].type;
            } else {
                signatureTypeGet = node.getSignature.type;
            }
            let signatureTypeGetParams = this.fillParameters((Array.isArray(node.getSignature) ? node.getSignature[0] : node.getSignature).parameters);
            signatureTypeGetBody = this.generateCallFunction(`get ${node.name}`, signatureTypeGetParams, []);
        }
        if (node.setSignature) {
            if (Array.isArray(node.setSignature)) {
                signatureTypeSet = node.setSignature[0].type;
            } else {
                signatureTypeSet = node.setSignature.type;
            }
            let signatureTypeSetParams = this.fillParameters((Array.isArray(node.setSignature) ? node.setSignature[0] : node.setSignature).parameters);
            signatureTypeSetBody = this.generateCallFunction(`set ${node.name}`, signatureTypeSetParams, []);
        }

        const model: YamlModel = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: langs,
            type: 'property',
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            syntax: {
                content: '',
                return: {
                    type: signatureTypeGet ? this.extractType(signatureTypeGet) : this.extractType(signatureTypeSet),
                    description: this.extractReturnComment(node.comment)
                }
            }
        };

        if (signatureTypeGet) {
            model.syntax.content += `${node.flags && node.flags.isStatic ? 'static ' : ''}${signatureTypeGetBody}: ${typeToString(this.extractType(signatureTypeGet)[0])}`;
        }
        if (signatureTypeGet && signatureTypeSet) {
            model.syntax.content += '\n';
        }
        if (signatureTypeSet) {
            model.syntax.content += `${node.flags && node.flags.isStatic ? 'static ' : ''}${signatureTypeSetBody}: ${typeToString(this.extractType(signatureTypeSet)[0])}`;
        }

        return [model];
    }
}
