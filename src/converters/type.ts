import { YamlModel, Type } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import * as _ from 'lodash';
import { Context } from './context';
import { langs } from '../common/constants';

export class TypeConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        // to add this to handle duplicate class and module under the same hirachy
        if (node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Type alias') {
            if (context.ParentKind === 'Class' || context.ParentKind === 'Interface') {
                const currentUid = context.ParentUid + `.${node.name}`;
                let mapping: string[] = [];
                if (this.references.has(context.ParentUid)) {
                    mapping = this.references.get(context.ParentUid);
                }
                mapping.push(currentUid);
                this.references.set(context.ParentUid, mapping);
            }
        }

        const uid = context.ParentUid + `.${node.name}`;
        console.log(`${node.kindString}: ${uid}`);
        const model: YamlModel = {
            uid: uid,
            name: node.name,
            fullName: node.name + this.getGenericType(node.typeParameter),
            children: [],
            langs: langs,
            type: node.kindString.toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : ''
        };
        if (model.type === 'enumeration') {
            model.type = 'enum';
        }

        if (model.type === 'type alias') {
            let typeArgumentsContent = this.parseTypeArgumentsForTypeAlias(node);
            if (typeArgumentsContent) {
                model.syntax = { content: 'type ' + model.name + typeArgumentsContent + ' = ' + this.parseTypeDeclarationForTypeAlias(node.type) };
            } else {
                model.syntax = { content: 'type ' + model.name + ' = ' + this.parseTypeDeclarationForTypeAlias(node.type) };
            }
        }

        if (node.extendedTypes && node.extendedTypes.length) {
            model.inheritance = [];
            for (const t of node.extendedTypes) {
                model.inheritance.push({ type: this.extractType(t)[0] });
            }
            model.inheritedMembers = [];
            for(let child of node.children) {
                if(!child.inheritedFrom) continue;
                model.inheritedMembers.push(this.extractType(child.inheritedFrom)[0] as any);
            }
            model.inheritedMembers = !model.inheritedMembers.length ? null : model.inheritedMembers;
        }

        if (node.implementedTypes && node.implementedTypes.length) {
            model.implements = node.implementedTypes.map(type => this.extractType(type)[0]);
        }

        return [model];
    }
}
