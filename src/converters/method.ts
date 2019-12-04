import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import * as _ from 'lodash';
import { Context } from './context';
import { convertLinkToGfm } from '../helpers/linkConvertHelper';

export class MethodConverter extends AbstractConverter {
    public convert(node: Node, context: Context): Array<YamlModel> {
        if (!node.signatures) {
            return;
        }

        const models = new Array<YamlModel>();
        for (let index = 0; index < node.signatures.length; index++) {
            let uid = context.ParentUid + '.' + node.name;
            if (index > 0) {
                uid += `_${index}`;
            }

            console.log(` - ${node.kindString}: ${uid}`);
            const model: YamlModel = {
                uid: uid,
                name: node.name,
                children: [],
                type: '',
                langs: ['typeScript'],
                summary: '',
                syntax: {
                    content: ''
                }
            };

            this.extractInformationFromSignature(model, node, index);
            model.name = this.composeMethodNameFromSignature(model);
            model.summary = convertLinkToGfm(model.summary);
            
            models.push(model);
        }


        return models;
    }
}
