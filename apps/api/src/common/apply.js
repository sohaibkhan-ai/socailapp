// Apply Nest decorators in plain JS without a transpiler.
const {
  ROUTE_ARGS_METADATA, CUSTOM_ROUTE_ARGS_METADATA, SELF_DECLARED_DEPS_METADATA, PARAMTYPES_METADATA,
} = require('@nestjs/common/constants');

function applyController(cls, path) {
  const { Controller } = require('@nestjs/common');
  Controller(path)(cls);
  return cls;
}

function applyMethods(cls, specs) {
  // specs: [{ method: 'get'|'post'|..., path, name, guards: [], decorators: [], params: [{index, factory, data}] }]
  const { Get, Post, Patch, Delete, Put, UseGuards, UseInterceptors, SetMetadata, HttpCode } = require('@nestjs/common');
  const methodMap = { get: Get, post: Post, patch: Patch, delete: Delete, put: Put };
  for (const spec of specs) {
    const desc = Object.getOwnPropertyDescriptor(cls.prototype, spec.name);
    for (const g of spec.guards || []) UseGuards(g)(cls.prototype, spec.name, desc);
    for (const d of spec.decorators || []) d(cls.prototype, spec.name, desc);
    if (spec.statusCode !== undefined) HttpCode(spec.statusCode)(cls.prototype, spec.name, desc);
    methodMap[spec.method](spec.path)(cls.prototype, spec.name, desc);
    // ROUTE_ARGS_METADATA is written exactly the way Nest expects (key
    // `${paramtype}${CUSTOM_ROUTE_ARGS_METADATA}:${index}` on the prototype,
    // under the method key). Never hand-build this metadata.
    for (const p of spec.params || []) {
      const make = FACTORY_TO_DECORATOR.get(p.factory);
      if (!make) throw new Error(`applyMethods: unknown param factory for ${spec.name} index ${p.index}`);
      make(p.data)(cls.prototype, spec.name, p.index);
    }
    // Swagger's parameter-metadata-accessor reads PARAMTYPES_METADATA
    // (design:paramtypes) for each method. Babel's legacy decorators do not
    // emit it for plain JS, so derive a best-effort type array from the
    // registered param factories (Object for anything custom-based, String
    // for path params) — Nest routing does not use this, only Swagger does.
    const params = spec.params || [];
    if (params.length > 0) {
      const paramtypes = new Array(Math.max(...params.map((p) => p.index)) + 1).fill(Object);
      for (const p of params) if (p.factory === rawParamFactory) paramtypes[p.index] = String;
      Reflect.defineMetadata(PARAMTYPES_METADATA, paramtypes, cls.prototype, spec.name);
    }
  }
}

function declareDeps(cls, ...tokens) {
  const meta = tokens.map((param, index) => ({ index, param }));
  Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, meta, cls);
  return cls;
}

// param factories — raw factories are what Nest expects in ROUTE_ARGS_METADATA
// (`factory(data, ctx)`); the createParamDecorator wrappers below are kept for
// direct decorator-style use in controllers.
const { createParamDecorator } = require('@nestjs/common');
const rawReqFactory = (d, ctx) => ctx.switchToHttp().getRequest();
const rawResFactory = (d, ctx) => ctx.switchToHttp().getResponse();
const rawBodyFactory = (d, ctx) => ctx.switchToHttp().getRequest().body;
const rawParamFactory = (d, ctx) => {
  const req = ctx.switchToHttp().getRequest();
  return d ? req.params[d] : req.params;
};
const rawQueryFactory = (d, ctx) => {
  const req = ctx.switchToHttp().getRequest();
  return d ? req.query[d] : req.query;
};
const rawFileFactory = (d, ctx) => ctx.switchToHttp().getRequest().file;
const rawCurrentUserFactory = (d, ctx) => (d ? ctx.switchToHttp().getRequest().user?.[d] : ctx.switchToHttp().getRequest().user);

const ReqFactory = createParamDecorator(rawReqFactory);
const ResFactory = createParamDecorator(rawResFactory);
const BodyFactory = createParamDecorator(rawBodyFactory);
const ParamFactory = createParamDecorator(rawParamFactory);
const QueryFactory = createParamDecorator(rawQueryFactory);
const FileFactory = createParamDecorator(rawFileFactory);
const CurrentUserFactory = createParamDecorator(rawCurrentUserFactory);

// Map raw factories (used in controller specs) to their real decorators so
// applyMethods can apply genuine createParamDecorator metadata.
const FACTORY_TO_DECORATOR = new Map([
  [rawReqFactory, ReqFactory],
  [rawResFactory, ResFactory],
  [rawBodyFactory, BodyFactory],
  [rawParamFactory, ParamFactory],
  [rawQueryFactory, QueryFactory],
  [rawFileFactory, FileFactory],
  [rawCurrentUserFactory, CurrentUserFactory],
]);

module.exports = {
  applyController, applyMethods, declareDeps,
  rawReqFactory, rawResFactory, rawBodyFactory, rawParamFactory, rawQueryFactory, rawFileFactory, rawCurrentUserFactory,
  ReqFactory, ResFactory, BodyFactory, ParamFactory, QueryFactory, FileFactory, CurrentUserFactory,
};
