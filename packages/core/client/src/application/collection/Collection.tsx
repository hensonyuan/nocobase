import { ISchema, SchemaKey } from '@formily/react';
import { filter } from 'lodash';

import type { CollectionManagerV2 } from './CollectionManager';

type dumpable = 'required' | 'optional' | 'skip';
type CollectionSortable = string | boolean | { name?: string; scopeKey?: string };

export interface CollectionFieldOptionsV2 {
  name?: any;
  collectionName?: string;
  sourceKey?: string; // association field
  uiSchema?: ISchema;
  target?: string;

  [key: string]: any;
}

export interface CollectionOptionsV2 {
  name: string;
  title?: string;
  namespace?: string;
  /**
   * Used for @nocobase/plugin-duplicator
   * @see packages/core/database/src/collection-group-manager.tss
   *
   * @prop {'required' | 'optional' | 'skip'} dumpable - Determine whether the collection is dumped
   * @prop {string[] | string} [with] - Collections dumped with this collection
   * @prop {any} [delayRestore] - A function to execute after all collections are restored
   */
  duplicator?:
    | dumpable
    | {
        dumpable: dumpable;
        with?: string[] | string;
        delayRestore?: any;
      };

  tableName?: string;
  inherits?: string[] | string;
  viewName?: string;
  writableView?: boolean;

  filterTargetKey?: string;
  fields?: CollectionFieldOptionsV2[];
  model?: any;
  repository?: any;
  sortable?: CollectionSortable;
  /**
   * @default true
   */
  autoGenId?: boolean;
  /**
   * @default 'options'
   */
  magicAttribute?: string;

  tree?: string;

  template?: string;

  [key: string]: any;
}

export type GetCollectionFieldPredicate =
  | ((collection: CollectionFieldOptionsV2) => boolean)
  | CollectionFieldOptionsV2
  | keyof CollectionFieldOptionsV2;

export class CollectionV2 {
  protected options: CollectionOptionsV2;
  protected fields: Record<string, CollectionFieldOptionsV2> = {};
  public collectionManager: CollectionManagerV2;

  constructor(options: CollectionOptionsV2, collectionManager: CollectionManagerV2) {
    this.options = options;
    this.setFields(options.fields || []);
    this.collectionManager = collectionManager;
  }
  get name() {
    return this.options.name;
  }
  get title() {
    return this.options.title;
  }
  get primaryKey(): string {
    if (this.options.targetKey) {
      return this.options.targetKey;
    }
    const field = this.getFields('primaryKey')[0];
    return field ? field.name : 'id';
  }
  get titleFieldName() {
    return this.hasField(this.options.titleField) ? this.options.titleField : this.primaryKey;
  }
  private setFields(fields: CollectionFieldOptionsV2[]) {
    this.fields = fields.reduce((memo, field) => {
      memo[field.name] = field;
      return memo;
    }, {});
  }
  getOptions() {
    return this.options;
  }
  getOption<K extends keyof CollectionOptionsV2>(key: K): CollectionOptionsV2[K] {
    return this.options[key];
  }
  setOptions<CollectionOptionsV2>(options: CollectionOptionsV2) {
    Object.assign(this.options, options);
    this.setFields(this.options.fields || []);
  }
  /**
   * Get fields
   * @param predicate https://www.lodashjs.com/docs/lodash.filter
   * @example
   * getFields() // 获取所有字段
   * getFields({ name: 'nickname' }) // 获取 name: 'nickname' 字段
   * getFields('primaryKey') // 获取 primaryKey: true 字段
   * getFields((field) => field.name === 'nickname') // 获取 name: 'nickname' 字段
   */
  getFields(predicate?: GetCollectionFieldPredicate) {
    return filter(this.options.fields || [], predicate);
  }
  getField(name: SchemaKey) {
    return this.fields[name];
  }
  hasField(name: SchemaKey) {
    return !!this.getField(name);
  }
}