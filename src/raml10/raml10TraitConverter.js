// @flow
const _ = require('lodash');
const Trait = require('../model/trait');
const Method = require('../model/method');
const Converter = require('../model/converter');
const Raml10MethodConverter = require('../raml10/raml10MethodConverter');
const helper = require('../helpers/converter');
 
class Raml10TraitConverter extends Converter {
	
	export(models:any) {
		const traits: Trait[] = models.traits;
		const result = {};

		if (_.isEmpty(traits)) return result;

		for (let i = 0; i < traits.length; i++) {
			const model: Trait = traits[i];
			result[model.name] = this._export(model);
		}

		return result;
	}
	
	// exports 1 trait definition
	_export(model:Trait) {
		const attrIdMap = {};
		
		const attrIdSkip = ['name', 'method'];
		const ramlDef = Raml10TraitConverter.createRamlDef(model, attrIdMap, attrIdSkip);
		const methodConverter = new Raml10MethodConverter(this.model, this.annotationPrefix, this.def);
		
		if (model.hasOwnProperty('method') && !_.isEmpty(model.method)) {
			const methodModel: ?Method = model.method;
			const method = methodConverter._export(methodModel);
			delete method.displayName;
			for (const id in method) {
				if (!method.hasOwnProperty(id)) continue;
				
				ramlDef[id] = method[id];
			}
		}
		
		return ramlDef;
	}
	
	static createRamlDef(trait, attrIdMap, attrIdSkip) {
		const result = {};
		
		_.assign(result, trait);
		attrIdSkip.map(id => {
			delete result[id];
		});
		_.keys(attrIdMap).map(id => {
			result[attrIdMap[id]] = result[id];
			delete result[id];
		});
		
		return result;
	}
	
	import(ramlDefs:any) {
		let result = [];
		if (_.isEmpty(ramlDefs)) return result;

		helper.removePropertiesFromObject(ramlDefs, ['typePropertyKind', 'structuredExample', 'fixedFacets']);
		for (const id in ramlDefs) {
			if (!ramlDefs.hasOwnProperty(id)) continue;
			
			const ramlDef = ramlDefs[id];
			result.push(this._import(ramlDef));
		}
		return result;
	}
	
	// imports 1 trait definition
	_import(ramlDef:any) {
		const model = new Trait();
		const methodConverter = new Raml10MethodConverter();
		methodConverter.version = this.version;
		
		if (!_.isEmpty(ramlDef)) {
			const traitName: string = Object.keys(ramlDef)[0];
			model.name = traitName;
			const def = ramlDef[traitName];
			if (def.hasOwnProperty('usage')) model.usage = def.usage;
			const method: Method = methodConverter._import(def);
			if (!_.isEmpty(method)) model.method = method;
		}
		
		return model;
	}
}

module.exports = Raml10TraitConverter;
