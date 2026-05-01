import { F as Firestore, r as FirestoreError, av as R, a7 as documentId$1, i as __PRIVATE_fieldPathFromArgument, aw as __PRIVATE_hardAssert, ax as __PRIVATE_parseData, ay as __PRIVATE_isString, az as __PRIVATE_toStringValue, aA as __PRIVATE_isNumber, X as VectorValue, at as vector, aB as __PRIVATE_isPlainObject, aC as __PRIVATE_isCollectionReference, G as DocumentReference, E, C as CollectionReference, e as __PRIVATE_getDatastore, d as __PRIVATE_cast, j as __PRIVATE_newUserDataReader, h as __PRIVATE_LiteUserDataWriter, aD as __PRIVATE_invokeExecutePipeline, O as ObjectValue, aE as FieldPath$1, f as __PRIVATE_mapToArray, aF as __PRIVATE_toMapValue, aG as __PRIVATE_isCollectionGroupQuery, aH as __PRIVATE_isDocumentQuery, a6 as doc, aI as __PRIVATE_queryNormalizedOrderBy, t as fail, aJ as toNumber, aK as __PRIVATE_toPipelineValue, aL as __PRIVATE_isUserData, aM as FieldFilter, aN as CompositeFilter } from './common-8f39af0f.esm.js';
import '@firebase/util';
import '@firebase/logger';
import '@firebase/webchannel-wrapper/bloom-blob';
import '@firebase/app';

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class OptionsUtil {
    constructor(e) {
        this.optionDefinitions = e;
    }
    _getKnownOptions(e, t) {
        const r = ObjectValue.empty();
        // SERIALIZE KNOWN OPTIONS
                for (const i in this.optionDefinitions) if (this.optionDefinitions.hasOwnProperty(i)) {
            const o = this.optionDefinitions[i];
            if (i in e) {
                const a = e[i];
                let u;
                if (o.nestedOptions && __PRIVATE_isPlainObject(a)) {
                    u = {
                        mapValue: {
                            fields: new OptionsUtil(o.nestedOptions).getOptionsProto(t, a)
                        }
                    };
                } else a && (u = __PRIVATE_parseData(a, t) ?? void 0);
                u && r.set(FieldPath$1.fromServerFormat(o.serverName), u);
            }
        }
        return r;
    }
    getOptionsProto(e, t, n) {
        const r = this._getKnownOptions(t, e);
        // APPLY OPTIONS OVERRIDES
                if (n) {
            const t = new Map(__PRIVATE_mapToArray(n, ((t, n) => [ FieldPath$1.fromServerFormat(n), void 0 !== t ? __PRIVATE_parseData(t, e) : null ])));
            r.setAll(t);
        }
        // Return MapValue from `result` or empty map value
                return r.value.mapValue.fields ?? {};
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class __PRIVATE_StructuredPipelineOptions {
    constructor(e = {}, t = {}) {
        this.Z = e, this.ee = t, this.te = new OptionsUtil({
            indexMode: {
                serverName: "index_mode"
            }
        });
    }
    _readUserData(e) {
        this.proto = this.te.getOptionsProto(e, this.Z, this.ee);
    }
}

class StructuredPipeline {
    constructor(e, t) {
        this.pipeline = e, this.options = t;
    }
    _toProto(e) {
        return {
            pipeline: this.pipeline._toProto(e),
            options: this.options.proto
        };
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint @typescript-eslint/no-explicit-any: 0 */ function __PRIVATE_isFirestoreValue(e) {
    return "object" == typeof e && null !== e && !!("nullValue" in e && (null === e.nullValue || "NULL_VALUE" === e.nullValue) || "booleanValue" in e && (null === e.booleanValue || "boolean" == typeof e.booleanValue) || "integerValue" in e && (null === e.integerValue || "number" == typeof e.integerValue || "string" == typeof e.integerValue) || "doubleValue" in e && (null === e.doubleValue || "number" == typeof e.doubleValue) || "timestampValue" in e && (null === e.timestampValue || function __PRIVATE_isITimestamp(e) {
        return "object" == typeof e && null !== e && "seconds" in e && (null === e.seconds || "number" == typeof e.seconds || "string" == typeof e.seconds) && "nanos" in e && (null === e.nanos || "number" == typeof e.nanos);
    }(e.timestampValue)) || "stringValue" in e && (null === e.stringValue || "string" == typeof e.stringValue) || "bytesValue" in e && (null === e.bytesValue || e.bytesValue instanceof Uint8Array) || "referenceValue" in e && (null === e.referenceValue || "string" == typeof e.referenceValue) || "geoPointValue" in e && (null === e.geoPointValue || function __PRIVATE_isILatLng(e) {
        return "object" == typeof e && null !== e && "latitude" in e && (null === e.latitude || "number" == typeof e.latitude) && "longitude" in e && (null === e.longitude || "number" == typeof e.longitude);
    }(e.geoPointValue)) || "arrayValue" in e && (null === e.arrayValue || function __PRIVATE_isIArrayValue(e) {
        return "object" == typeof e && null !== e && !(!("values" in e) || null !== e.values && !Array.isArray(e.values));
    }(e.arrayValue)) || "mapValue" in e && (null === e.mapValue || function __PRIVATE_isIMapValue(e) {
        return "object" == typeof e && null !== e && !(!("fields" in e) || null !== e.fields && !__PRIVATE_isPlainObject(e.fields));
    }(e.mapValue)) || "fieldReferenceValue" in e && (null === e.fieldReferenceValue || "string" == typeof e.fieldReferenceValue) || "functionValue" in e && (null === e.functionValue || function __PRIVATE_isIFunction(e) {
        return "object" == typeof e && null !== e && !(!("name" in e) || null !== e.name && "string" != typeof e.name || !("args" in e) || null !== e.args && !Array.isArray(e.args));
    }(e.functionValue)) || "pipelineValue" in e && (null === e.pipelineValue || function __PRIVATE_isIPipeline(e) {
        return "object" == typeof e && null !== e && !(!("stages" in e) || null !== e.stages && !Array.isArray(e.stages));
    }(e.pipelineValue)));
    // Check optional properties and their types
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */ function __PRIVATE_valueToDefaultExpr$1(e) {
    let t;
    return e instanceof Expression ? e : (t = __PRIVATE_isPlainObject(e) ? __PRIVATE__map(e) : e instanceof Array ? array(e) : __PRIVATE__constant(e, void 0), 
    t);
}

/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */ function __PRIVATE_vectorToExpr$1(e) {
    if (e instanceof Expression) return e;
    if (e instanceof VectorValue) return constant(e);
    if (Array.isArray(e)) return constant(vector(e));
    throw new Error("Unsupported value: " + typeof e);
}

/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 * If the input is a string, it is assumed to be a field name, and a
 * field(value) is returned.
 *
 * @private
 * @internal
 * @param value
 */ function __PRIVATE_fieldOrExpression$1(e) {
    if (__PRIVATE_isString(e)) {
        return field(e);
    }
    return __PRIVATE_valueToDefaultExpr$1(e);
}

/**
 *
 * Represents an expression that can be evaluated to a value within the execution of a {@link
 * @firebase/firestore/pipelines#Pipeline}.
 *
 * Expressions are the building blocks for creating complex queries and transformations in
 * Firestore pipelines. They can represent:
 *
 * - **Field references:** Access values from document fields.
 * - **Literals:** Represent constant values (strings, numbers, booleans).
 * - **Function calls:** Apply functions to one or more expressions.
 *
 * The `Expression` class provides a fluent API for building expressions. You can chain together
 * method calls to create complex expressions.
 */ class Expression {
    constructor() {
        this._protoValueType = "ProtoValue";
    }
    /**
     * Creates an expression that adds this expression to another expression.
     *
     * @example
     * ```typescript
     * // Add the value of the 'quantity' field and the 'reserve' field.
     * field("quantity").add(field("reserve"));
     * ```
     *
     * @param second - The expression or literal to add to this expression.
     * @param others - Optional additional expressions or literals to add to this expression.
     * @returns A new `Expression` representing the addition operation.
     */    add(e) {
        return new FunctionExpression("add", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "add");
    }
    /**
     * Wraps the expression in a [BooleanExpression].
     *
     * @returns A [BooleanExpression] representing the same expression.
     */    asBoolean() {
        if (this instanceof BooleanExpression) return this;
        if (this instanceof Constant) return new __PRIVATE_BooleanConstant(this);
        if (this instanceof Field) return new __PRIVATE_BooleanField(this);
        if (this instanceof FunctionExpression) return new __PRIVATE_BooleanFunctionExpression(this);
        throw new FirestoreError("invalid-argument", `Conversion of type ${typeof this} to BooleanExpression not supported.`);
    }
    subtract(e) {
        return new FunctionExpression("subtract", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "subtract");
    }
    /**
     * Creates an expression that multiplies this expression by another expression.
     *
     * @example
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * field("quantity").multiply(field("price"));
     * ```
     *
     * @param second - The second expression or literal to multiply by.
     * @param others - Optional additional expressions or literals to multiply by.
     * @returns A new `Expression` representing the multiplication operation.
     */    multiply(e) {
        return new FunctionExpression("multiply", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "multiply");
    }
    divide(e) {
        return new FunctionExpression("divide", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "divide");
    }
    mod(e) {
        return new FunctionExpression("mod", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "mod");
    }
    equal(e) {
        return new FunctionExpression("equal", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "equal").asBoolean();
    }
    notEqual(e) {
        return new FunctionExpression("not_equal", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "notEqual").asBoolean();
    }
    lessThan(e) {
        return new FunctionExpression("less_than", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "lessThan").asBoolean();
    }
    lessThanOrEqual(e) {
        return new FunctionExpression("less_than_or_equal", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "lessThanOrEqual").asBoolean();
    }
    greaterThan(e) {
        return new FunctionExpression("greater_than", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "greaterThan").asBoolean();
    }
    greaterThanOrEqual(e) {
        return new FunctionExpression("greater_than_or_equal", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "greaterThanOrEqual").asBoolean();
    }
    /**
     * Creates an expression that concatenates an array expression with one or more other arrays.
     *
     * @example
     * ```typescript
     * // Combine the 'items' array with another array field.
     * field("items").arrayConcat(field("otherItems"));
     * ```
     * @param secondArray - Second array expression or array literal to concatenate.
     * @param otherArrays - Optional additional array expressions or array literals to concatenate.
     * @returns A new `Expression` representing the concatenated array.
     */    arrayConcat(e, ...t) {
        const n = [ e, ...t ].map((e => __PRIVATE_valueToDefaultExpr$1(e)));
        return new FunctionExpression("array_concat", [ this, ...n ], "arrayConcat");
    }
    arrayContains(e) {
        return new FunctionExpression("array_contains", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayContains").asBoolean();
    }
    arrayContainsAll(e) {
        const t = Array.isArray(e) ? new __PRIVATE_ListOfExprs(e.map(__PRIVATE_valueToDefaultExpr$1), "arrayContainsAll") : e;
        return new FunctionExpression("array_contains_all", [ this, t ], "arrayContainsAll").asBoolean();
    }
    arrayContainsAny(e) {
        const t = Array.isArray(e) ? new __PRIVATE_ListOfExprs(e.map(__PRIVATE_valueToDefaultExpr$1), "arrayContainsAny") : e;
        return new FunctionExpression("array_contains_any", [ this, t ], "arrayContainsAny").asBoolean();
    }
    /**
     * Creates an expression that reverses an array.
     *
     * @example
     * ```typescript
     * // Reverse the value of the 'myArray' field.
     * field("myArray").arrayReverse();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the reversed array.
     */    arrayReverse() {
        return new FunctionExpression("array_reverse", [ this ]);
    }
    /**
     * Creates an expression that calculates the length of an array.
     *
     * @example
     * ```typescript
     * // Get the number of items in the 'cart' array
     * field("cart").arrayLength();
     * ```
     *
     * @returns A new `Expression` representing the length of the array.
     */    arrayLength() {
        return new FunctionExpression("array_length", [ this ], "arrayLength");
    }
    equalAny(e) {
        const t = Array.isArray(e) ? new __PRIVATE_ListOfExprs(e.map(__PRIVATE_valueToDefaultExpr$1), "equalAny") : e;
        return new FunctionExpression("equal_any", [ this, t ], "equalAny").asBoolean();
    }
    notEqualAny(e) {
        const t = Array.isArray(e) ? new __PRIVATE_ListOfExprs(e.map(__PRIVATE_valueToDefaultExpr$1), "notEqualAny") : e;
        return new FunctionExpression("not_equal_any", [ this, t ], "notEqualAny").asBoolean();
    }
    /**
     * Creates an expression that checks if a field exists in the document.
     *
     * @example
     * ```typescript
     * // Check if the document has a field named "phoneNumber"
     * field("phoneNumber").exists();
     * ```
     *
     * @returns A new `Expression` representing the 'exists' check.
     */    exists() {
        return new FunctionExpression("exists", [ this ], "exists").asBoolean();
    }
    /**
     * Creates an expression that calculates the character length of a string in UTF-8.
     *
     * @example
     * ```typescript
     * // Get the character length of the 'name' field in its UTF-8 form.
     * field("name").charLength();
     * ```
     *
     * @returns A new `Expression` representing the length of the string.
     */    charLength() {
        return new FunctionExpression("char_length", [ this ], "charLength");
    }
    like(e) {
        return new FunctionExpression("like", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "like").asBoolean();
    }
    regexContains(e) {
        return new FunctionExpression("regex_contains", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "regexContains").asBoolean();
    }
    regexFind(e) {
        return new FunctionExpression("regex_find", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "regexFind");
    }
    regexFindAll(e) {
        return new FunctionExpression("regex_find_all", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "regexFindAll");
    }
    regexMatch(e) {
        return new FunctionExpression("regex_match", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "regexMatch").asBoolean();
    }
    stringContains(e) {
        return new FunctionExpression("string_contains", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "stringContains").asBoolean();
    }
    startsWith(e) {
        return new FunctionExpression("starts_with", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "startsWith").asBoolean();
    }
    endsWith(e) {
        return new FunctionExpression("ends_with", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "endsWith").asBoolean();
    }
    /**
     * Creates an expression that converts a string to lowercase.
     *
     * @example
     * ```typescript
     * // Convert the 'name' field to lowercase
     * field("name").toLower();
     * ```
     *
     * @returns A new `Expression` representing the lowercase string.
     */    toLower() {
        return new FunctionExpression("to_lower", [ this ], "toLower");
    }
    /**
     * Creates an expression that converts a string to uppercase.
     *
     * @example
     * ```typescript
     * // Convert the 'title' field to uppercase
     * field("title").toUpper();
     * ```
     *
     * @returns A new `Expression` representing the uppercase string.
     */    toUpper() {
        return new FunctionExpression("to_upper", [ this ], "toUpper");
    }
    /**
     * Creates an expression that removes leading and trailing characters from a string or byte array.
     *
     * @example
     * ```typescript
     * // Trim whitespace from the 'userInput' field
     * field("userInput").trim();
     *
     * // Trim quotes from the 'userInput' field
     * field("userInput").trim('"');
     * ```
     * @param valueToTrim - Optional This parameter is treated as a set of characters or bytes that will be
     * trimmed from the input. If not specified, then whitespace will be trimmed.
     * @returns A new `Expression` representing the trimmed string or byte array.
     */    trim(e) {
        const t = [ this ];
        return e && t.push(__PRIVATE_valueToDefaultExpr$1(e)), new FunctionExpression("trim", t, "trim");
    }
    /**
     * Trims whitespace or a specified set of characters/bytes from the beginning of a string or byte array.
     *
     * @example
     * ```typescript
     * // Trim whitespace from the beginning of the 'userInput' field
     * field("userInput").ltrim();
     *
     * // Trim quotes from the beginning of the 'userInput' field
     * field("userInput").ltrim('"');
     * ```
     *
     * @param valueToTrim - Optional. A string or byte array containing the characters/bytes to trim.
     * If not specified, whitespace will be trimmed.
     * @returns A new `Expression` representing the trimmed string.
     */    ltrim(e) {
        const t = [ this ];
        return e && t.push(__PRIVATE_valueToDefaultExpr$1(e)), new FunctionExpression("ltrim", t, "ltrim");
    }
    /**
     * Trims whitespace or a specified set of characters/bytes from the end of a string or byte array.
     *
     * @example
     * ```typescript
     * // Trim whitespace from the end of the 'userInput' field
     * field("userInput").rtrim();
     *
     * // Trim quotes from the end of the 'userInput' field
     * field("userInput").rtrim('"');
     * ```
     *
     * @param valueToTrim - Optional. A string or byte array containing the characters/bytes to trim.
     * If not specified, whitespace will be trimmed.
     * @returns A new `Expression` representing the trimmed string or byte array.
     */    rtrim(e) {
        const t = [ this ];
        return e && t.push(__PRIVATE_valueToDefaultExpr$1(e)), new FunctionExpression("rtrim", t, "rtrim");
    }
    /**
     * Creates an expression that returns the data type of this expression's result, as a string.
     *
     * @remarks
     * This is evaluated on the backend. This means:
     * 1. Generic typed elements (like `array<string>`) evaluate strictly to the primitive `'array'`.
     * 2. Any custom `FirestoreDataConverter` mappings are ignored.
     * 3. For numeric values, the backend does not yield the JavaScript `"number"` type; it evaluates
     *    precisely as `"int64"` or `"float64"`.
     * 4. For date or timestamp objects, the backend evaluates to `"timestamp"`.
     *
     * @example
     * ```typescript
     * // Get the data type of the value in field 'title'
     * field('title').type()
     * ```
     *
     * @returns A new `Expression` representing the data type.
     */    type() {
        return new FunctionExpression("type", [ this ]);
    }
    /**
     * Creates an expression that checks if the result of this expression is of the given type.
     *
     * @remarks Null or undefined fields evaluate to skip/error. Use `ifAbsent()` / `isAbsent()` to evaluate missing data.
     * Supported values for `type` are:
     * `'null'`, `'array'`, `'boolean'`, `'bytes'`, `'timestamp'`, `'geo_point'`, `'number'`,
     * `'int32'`, `'int64'`, `'float64'`, `'decimal128'`, `'map'`, `'reference'`, `'string'`,
     * `'vector'`, `'max_key'`, `'min_key'`, `'object_id'`, `'regex'`, `'request_timestamp'`.
     *
     * @example
     * ```typescript
     * // Check if the 'price' field is specifically an integer (not just 'number')
     * field('price').isType('int64');
     * ```
     *
     * @param type - The type to check for.
     * @returns A new `BooleanExpression` that evaluates to true if the expression's result is of the given type, false otherwise.
     */    isType(e) {
        return new FunctionExpression("is_type", [ this, constant(e) ], "isType").asBoolean();
    }
    /**
     * Creates an expression that concatenates string expressions together.
     *
     * @example
     * ```typescript
     * // Combine the 'firstName', " ", and 'lastName' fields into a single string
     * field("firstName").stringConcat(constant(" "), field("lastName"));
     * ```
     *
     * @param secondString - The additional expression or string literal to concatenate.
     * @param otherStrings - Optional additional expressions or string literals to concatenate.
     * @returns A new `Expression` representing the concatenated string.
     */    stringConcat(e, ...t) {
        const n = [ e, ...t ].map(__PRIVATE_valueToDefaultExpr$1);
        return new FunctionExpression("string_concat", [ this, ...n ], "stringConcat");
    }
    /**
     * Creates an expression that finds the index of the first occurrence of a substring or byte sequence.
     *
     * @example
     * ```typescript
     * // Find the index of "foo" in the 'text' field
     * field("text").stringIndexOf("foo");
     * ```
     *
     * @param search - The substring or byte sequence to search for.
     * @returns A new `Expression` representing the index of the first occurrence.
     */    stringIndexOf(e) {
        return new FunctionExpression("string_index_of", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "stringIndexOf");
    }
    /**
     * Creates an expression that repeats a string or byte array a specified number of times.
     *
     * @example
     * ```typescript
     * // Repeat the 'label' field 3 times
     * field("label").stringRepeat(3);
     * ```
     *
     * @param repetitions - The number of times to repeat the string or byte array.
     * @returns A new `Expression` representing the repeated string or byte array.
     */    stringRepeat(e) {
        return new FunctionExpression("string_repeat", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "stringRepeat");
    }
    /**
     * Creates an expression that replaces all occurrences of a substring or byte sequence with a replacement.
     *
     * @example
     * ```typescript
     * // Replace all occurrences of "foo" with "bar" in the 'text' field
     * field("text").stringReplaceAll("foo", "bar");
     * ```
     *
     * @param find - The substring or byte sequence to search for.
     * @param replacement - The replacement string or byte sequence.
     * @returns A new `Expression` representing the string or byte array with replacements.
     */    stringReplaceAll(e, t) {
        return new FunctionExpression("string_replace_all", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t) ], "stringReplaceAll");
    }
    /**
     * Creates an expression that replaces the first occurrence of a substring or byte sequence with a replacement.
     *
     * @example
     * ```typescript
     * // Replace the first occurrence of "foo" with "bar" in the 'text' field
     * field("text").stringReplaceOne("foo", "bar");
     * ```
     *
     * @param find - The substring or byte sequence to search for.
     * @param replacement - The replacement string or byte sequence.
     * @returns A new `Expression` representing the string or byte array with the replacement.
     */    stringReplaceOne(e, t) {
        return new FunctionExpression("string_replace_one", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t) ], "stringReplaceOne");
    }
    /**
     * Creates an expression that concatenates expression results together.
     *
     * @example
     * ```typescript
     * // Combine the 'firstName', ' ', and 'lastName' fields into a single value.
     * field("firstName").concat(constant(" "), field("lastName"));
     * ```
     *
     * @param second - The additional expression or literal to concatenate.
     * @param others - Optional additional expressions or literals to concatenate.
     * @returns A new `Expression` representing the concatenated value.
     */    concat(e, ...t) {
        const n = [ e, ...t ].map(__PRIVATE_valueToDefaultExpr$1);
        return new FunctionExpression("concat", [ this, ...n ], "concat");
    }
    /**
     * Creates an expression that reverses this string expression.
     *
     * @example
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * field("myString").reverse();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the reversed string.
     */    reverse() {
        return new FunctionExpression("reverse", [ this ], "reverse");
    }
    /**
     * Filters the array using a provided alias and predicate expression.
     *
     * @example
     * ```typescript
     * // Filter the 'items' array to only include those where the 'price' is greater than 10
     * field("items").arrayFilter('item', greaterThan(variable('item.price'), 10));
     * ```
     *
     * @param alias - The variable name to use for each element.
     * @param filter - The predicate boolean expression to filter by.
     * @returns A new `Expression` representing the filtered array.
     */    arrayFilter(e, t) {
        return new FunctionExpression("array_filter", [ this, __PRIVATE_valueToDefaultExpr$1(e), t ], "arrayFilter");
    }
    /**
     * Creates an expression that applies a provided transformation to each element in an array.
     *
     * @example
     * ```typescript
     * // Transform the 'scores' array by multiplying each score by 10
     * field("scores").arrayTransform("score", multiply(variable("score"), 10));
     * ```
     *
     * @param elementAlias - The variable name to use for each element.
     * @param transform - The lambda expression used to transform the elements.
     * @returns A new `Expression` representing the arrayTransform operation.
     */    arrayTransform(e, t) {
        return new FunctionExpression("array_transform", [ this, __PRIVATE_valueToDefaultExpr$1(e), t ], "arrayTransform");
    }
    /**
     * Creates an expression that applies a provided transformation to each element in an array, providing the element's index to the transformation expression.
     *
     * @example
     * ```typescript
     * // Transform the 'scores' array by adding the index to each score
     * field("scores").arrayTransformWithIndex("score", "i", add(variable("score"), variable("i")));
     * ```
     *
     * @param elementAlias - The variable name to use for each element.
     * @param indexAlias - The variable name to use for the current index.
     * @param transform - The lambda expression used to transform the elements.
     * @returns A new `Expression` representing the arrayTransformWithIndex operation.
     */    arrayTransformWithIndex(e, t, n) {
        return new FunctionExpression("array_transform", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t), n ], "arrayTransformWithIndex");
    }
    /**
     * Returns a subset of the array.
     *
     * @example
     * ```typescript
     * // Get 5 elements from the 'items' array starting from index 2
     * field("items").arraySlice(2, 5);
     *
     * // Get n number of elements from the 'items' array starting from index 2
     * field("items").arraySlice(2, field("count"));
     * ```
     *
     * @param offset - The starting offset.
     * @param length - The optional length of the slice.
     * @returns A new `Expression` representing the sliced array.
     */    arraySlice(e, t) {
        const n = [ this, __PRIVATE_valueToDefaultExpr$1(e) ];
        return void 0 !== t && n.push(__PRIVATE_valueToDefaultExpr$1(t)), new FunctionExpression("array_slice", n, "arraySlice");
    }
    /**
     * Returns the first element of the array.
     *
     * @example
     * ```typescript
     * // Get the first element of the 'myArray' field.
     * field("myArray").arrayFirst();
     * ```
     *
     * @returns A new `Expression` representing the first element.
     */    arrayFirst() {
        return new FunctionExpression("array_first", [ this ], "arrayFirst");
    }
    arrayFirstN(e) {
        return new FunctionExpression("array_first_n", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayFirstN");
    }
    /**
     * Returns the last element of the array.
     *
     * @example
     * ```typescript
     * // Get the last element of the 'myArray' field.
     * field("myArray").arrayLast();
     * ```
     *
     * @returns A new `Expression` representing the last element.
     */    arrayLast() {
        return new FunctionExpression("array_last", [ this ], "arrayLast");
    }
    arrayLastN(e) {
        return new FunctionExpression("array_last_n", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayLastN");
    }
    /**
     * Returns the maximum value in the array.
     *
     * @example
     * ```typescript
     * // Get the maximum value of the 'myArray' field.
     * field("myArray").arrayMaximum();
     * ```
     *
     * @returns A new `Expression` representing the maximum value.
     */    arrayMaximum() {
        return new FunctionExpression("maximum", [ this ], "arrayMaximum");
    }
    arrayMaximumN(e) {
        return new FunctionExpression("maximum_n", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayMaximumN");
    }
    /**
     * Returns the minimum value in the array.
     *
     * @example
     * ```typescript
     * // Get the minimum value of the 'myArray' field.
     * field("myArray").arrayMinimum();
     * ```
     *
     * @returns A new `Expression` representing the minimum value.
     */    arrayMinimum() {
        return new FunctionExpression("minimum", [ this ], "arrayMinimum");
    }
    arrayMinimumN(e) {
        return new FunctionExpression("minimum_n", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayMinimumN");
    }
    arrayIndexOf(e) {
        return new FunctionExpression("array_index_of", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1("first") ], "arrayIndexOf");
    }
    arrayLastIndexOf(e) {
        return new FunctionExpression("array_index_of", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1("last") ], "arrayLastIndexOf");
    }
    arrayIndexOfAll(e) {
        return new FunctionExpression("array_index_of_all", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayIndexOfAll");
    }
    /**
     * Creates an expression that calculates the length of this string expression in bytes.
     *
     * @example
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * field("myString").byteLength();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the length of the string in bytes.
     */    byteLength() {
        return new FunctionExpression("byte_length", [ this ], "byteLength");
    }
    /**
     * Creates an expression that computes the ceiling of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the ceiling of the 'price' field.
     * field("price").ceil();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the ceiling of the numeric value.
     */    ceil() {
        return new FunctionExpression("ceil", [ this ]);
    }
    /**
     * Creates an expression that computes the floor of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the floor of the 'price' field.
     * field("price").floor();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the floor of the numeric value.
     */    floor() {
        return new FunctionExpression("floor", [ this ]);
    }
    /**
     * Creates an expression that computes the absolute value of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the absolute value of the 'price' field.
     * field("price").abs();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the absolute value of the numeric value.
     */    abs() {
        return new FunctionExpression("abs", [ this ]);
    }
    /**
     * Creates an expression that computes e to the power of this expression.
     *
     * @example
     * ```typescript
     * // Compute e to the power of the 'value' field.
     * field("value").exp();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the exp of the numeric value.
     */    exp() {
        return new FunctionExpression("exp", [ this ]);
    }
    /**
     * Accesses a value from a map (object) field using the provided key.
     *
     * @example
     * ```typescript
     * // Get the 'city' value from the 'address' map field
     * field("address").mapGet("city");
     * ```
     *
     * @param subfield - The key to access in the map.
     * @returns A new `Expression` representing the value associated with the given key in the map.
     */    mapGet(e) {
        return new FunctionExpression("map_get", [ this, constant(e) ], "mapGet");
    }
    /**
     * Creates an expression that returns a new map with the specified entries added or updated.
     *
     * @remarks
     * Note that `mapSet` only performs shallow updates to the map. Setting a value to `null`
     * will retain the key with a `null` value. To remove a key entirely, use `mapRemove`.
     *
     * @example
     * ```typescript
     * // Set the 'city' to "San Francisco" in the 'address' map
     * field("address").mapSet("city", "San Francisco");
     * ```
     *
     * @param key - The key to set. Must be a string or a constant string expression.
     * @param value - The value to set.
     * @param moreKeyValues - Additional key-value pairs to set.
     * @returns A new `Expression` representing the map with the entries set.
     */    mapSet(e, t, ...n) {
        const r = [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t), ...n.map(__PRIVATE_valueToDefaultExpr$1) ];
        return new FunctionExpression("map_set", r, "mapSet");
    }
    /**
     * Creates an expression that returns the keys of a map.
     *
     * @remarks
     * While the backend generally preserves insertion order, relying on the
     * order of the output array is not guaranteed and should be avoided.
     *
     * @example
     * ```typescript
     * // Get the keys of the 'address' map
     * field("address").mapKeys();
     * ```
     *
     * @returns A new `Expression` representing the keys of the map.
     */    mapKeys() {
        return new FunctionExpression("map_keys", [ this ], "mapKeys");
    }
    /**
     * Creates an expression that returns the values of a map.
     *
     * @remarks
     * While the backend generally preserves insertion order, relying on the
     * order of the output array is not guaranteed and should be avoided.
     *
     * @example
     * ```typescript
     * // Get the values of the 'address' map
     * field("address").mapValues();
     * ```
     *
     * @returns A new `Expression` representing the values of the map.
     */    mapValues() {
        return new FunctionExpression("map_values", [ this ], "mapValues");
    }
    /**
     * Creates an expression that returns the entries of a map as an array of maps,
     * where each map contains a `"k"` property for the key and a `"v"` property for the value.
     * For example: `[{ k: "key1", v: "value1" }, ...]`.
     *
     * @example
     * ```typescript
     * // Get the entries of the 'address' map
     * field("address").mapEntries();
     * ```
     *
     * @returns A new `Expression` representing the entries of the map.
     */    mapEntries() {
        return new FunctionExpression("map_entries", [ this ], "mapEntries");
    }
    /**
     * @public
     * Creates an expression that returns the value of a field from the document that results from the evaluation of this expression.
     *
     * @example
     * ```typescript
     * // Get the value of the "city" field in the "address" document.
     * field("address").getField("city")
     * ```
     *
     * @param key The field to access in the document.
     * @returns A new `Expression` representing the value of the field in the document.
     */    getField(e) {
        return new FunctionExpression("get_field", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "get_field");
    }
    /**
     * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
     * expression or field.
     *
     * @example
     * ```typescript
     * // Count the total number of products
     * field("productId").count().as("totalProducts");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'count' aggregation.
     */    count() {
        return AggregateFunction._create("count", [ this ], "count");
    }
    /**
     * Creates an aggregation that calculates the sum of a numeric field across multiple stage inputs.
     *
     * @example
     * ```typescript
     * // Calculate the total revenue from a set of orders
     * field("orderAmount").sum().as("totalRevenue");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'sum' aggregation.
     */    sum() {
        return AggregateFunction._create("sum", [ this ], "sum");
    }
    /**
     * Creates an aggregation that calculates the average (mean) of a numeric field across multiple
     * stage inputs.
     *
     * @example
     * ```typescript
     * // Calculate the average age of users
     * field("age").average().as("averageAge");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'average' aggregation.
     */    average() {
        return AggregateFunction._create("average", [ this ], "average");
    }
    /**
     * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
     *
     * @example
     * ```typescript
     * // Find the lowest price of all products
     * field("price").minimum().as("lowestPrice");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'minimum' aggregation.
     */    minimum() {
        return AggregateFunction._create("minimum", [ this ], "minimum");
    }
    /**
     * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
     *
     * @example
     * ```typescript
     * // Find the highest score in a leaderboard
     * field("score").maximum().as("highestScore");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'maximum' aggregation.
     */    maximum() {
        return AggregateFunction._create("maximum", [ this ], "maximum");
    }
    /**
     * Creates an aggregation that finds the first value of an expression across multiple stage inputs.
     *
     * @example
     * ```typescript
     * // Find the first value of the 'rating' field
     * field("rating").first().as("firstRating");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'first' aggregation.
     */    first() {
        return AggregateFunction._create("first", [ this ], "first");
    }
    /**
     * Creates an aggregation that finds the last value of an expression across multiple stage inputs.
     *
     * @example
     * ```typescript
     * // Find the last value of the 'rating' field
     * field("rating").last().as("lastRating");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'last' aggregation.
     */    last() {
        return AggregateFunction._create("last", [ this ], "last");
    }
    /**
     * Creates an aggregation that collects all values of an expression across multiple stage inputs
     * into an array.
     *
     * @remarks
     * If the expression resolves to an absent value, it is converted to `null`.
     * The order of elements in the output array is not stable and shouldn't be relied upon.
     *
     * @example
     * ```typescript
     * // Collect all tags from books into an array
     * field("tags").arrayAgg().as("allTags");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'array_agg' aggregation.
     */    arrayAgg() {
        return AggregateFunction._create("array_agg", [ this ], "arrayAgg");
    }
    /**
     * Creates an aggregation that collects all distinct values of an expression across multiple stage
     * inputs into an array.
     *
     * @remarks
     * If the expression resolves to an absent value, it is converted to `null`.
     * The order of elements in the output array is not stable and shouldn't be relied upon.
     *
     * @example
     * ```typescript
     * // Collect all distinct tags from books into an array
     * field("tags").arrayAggDistinct().as("allDistinctTags");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'array_agg_distinct' aggregation.
     */    arrayAggDistinct() {
        return AggregateFunction._create("array_agg_distinct", [ this ], "arrayAggDistinct");
    }
    /**
     * Creates an aggregation that counts the number of distinct values of the expression or field.
     *
     * @example
     * ```typescript
     * // Count the distinct number of products
     * field("productId").countDistinct().as("distinctProducts");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'count_distinct' aggregation.
     */    countDistinct() {
        return AggregateFunction._create("count_distinct", [ this ], "countDistinct");
    }
    /**
     * Creates an expression that returns the larger value between this expression and another expression, based on Firestore's value type ordering.
     *
     * @example
     * ```typescript
     * // Returns the larger value between the 'timestamp' field and the current timestamp.
     * field("timestamp").logicalMaximum(currentTimestamp());
     * ```
     *
     * @param second - The second expression or literal to compare with.
     * @param others - Optional additional expressions or literals to compare with.
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the logical maximum operation.
     */    logicalMaximum(e, ...t) {
        const n = [ e, ...t ];
        return new FunctionExpression("maximum", [ this, ...n.map(__PRIVATE_valueToDefaultExpr$1) ], "logicalMaximum");
    }
    /**
     * Creates an expression that returns the smaller value between this expression and another expression, based on Firestore's value type ordering.
     *
     * @example
     * ```typescript
     * // Returns the smaller value between the 'timestamp' field and the current timestamp.
     * field("timestamp").logicalMinimum(currentTimestamp());
     * ```
     *
     * @param second - The second expression or literal to compare with.
     * @param others - Optional additional expressions or literals to compare with.
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the logical minimum operation.
     */    logicalMinimum(e, ...t) {
        const n = [ e, ...t ];
        return new FunctionExpression("minimum", [ this, ...n.map(__PRIVATE_valueToDefaultExpr$1) ], "minimum");
    }
    /**
     * Creates an expression that calculates the length (number of dimensions) of this Firestore Vector expression.
     *
     * @example
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * field("embedding").vectorLength();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the length of the vector.
     */    vectorLength() {
        return new FunctionExpression("vector_length", [ this ], "vectorLength");
    }
    cosineDistance(e) {
        return new FunctionExpression("cosine_distance", [ this, __PRIVATE_vectorToExpr$1(e) ], "cosineDistance");
    }
    dotProduct(e) {
        return new FunctionExpression("dot_product", [ this, __PRIVATE_vectorToExpr$1(e) ], "dotProduct");
    }
    euclideanDistance(e) {
        return new FunctionExpression("euclidean_distance", [ this, __PRIVATE_vectorToExpr$1(e) ], "euclideanDistance");
    }
    /**
     * Creates an expression that interprets this expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * @example
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * field("microseconds").unixMicrosToTimestamp();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the timestamp.
     */    unixMicrosToTimestamp() {
        return new FunctionExpression("unix_micros_to_timestamp", [ this ], "unixMicrosToTimestamp");
    }
    /**
     * Creates an expression that converts this timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * @example
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * field("timestamp").timestampToUnixMicros();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the number of microseconds since epoch.
     */    timestampToUnixMicros() {
        return new FunctionExpression("timestamp_to_unix_micros", [ this ], "timestampToUnixMicros");
    }
    /**
     * Creates an expression that interprets this expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * @example
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * field("milliseconds").unixMillisToTimestamp();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the timestamp.
     */    unixMillisToTimestamp() {
        return new FunctionExpression("unix_millis_to_timestamp", [ this ], "unixMillisToTimestamp");
    }
    /**
     * Creates an expression that converts this timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * @example
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * field("timestamp").timestampToUnixMillis();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the number of milliseconds since epoch.
     */    timestampToUnixMillis() {
        return new FunctionExpression("timestamp_to_unix_millis", [ this ], "timestampToUnixMillis");
    }
    /**
     * Creates an expression that interprets this expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * @example
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * field("seconds").unixSecondsToTimestamp();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the timestamp.
     */    unixSecondsToTimestamp() {
        return new FunctionExpression("unix_seconds_to_timestamp", [ this ], "unixSecondsToTimestamp");
    }
    /**
     * Creates an expression that converts this timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * @example
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * field("timestamp").timestampToUnixSeconds();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the number of seconds since epoch.
     */    timestampToUnixSeconds() {
        return new FunctionExpression("timestamp_to_unix_seconds", [ this ], "timestampToUnixSeconds");
    }
    timestampAdd(e, t) {
        return new FunctionExpression("timestamp_add", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t) ], "timestampAdd");
    }
    timestampSubtract(e, t) {
        return new FunctionExpression("timestamp_subtract", [ this, __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t) ], "timestampSubtract");
    }
    timestampDiff(e, t) {
        return new FunctionExpression("timestamp_diff", [ this, __PRIVATE_fieldOrExpression$1(e), __PRIVATE_valueToDefaultExpr$1(t) ], "timestampDiff");
    }
    timestampExtract(e, t) {
        const n = [ this, __PRIVATE_valueToDefaultExpr$1(e) ];
        return t && n.push(__PRIVATE_valueToDefaultExpr$1(t)), new FunctionExpression("timestamp_extract", n, "timestampExtract");
    }
    /**
     *
     * Creates an expression that returns the document ID from a path.
     *
     * @example
     * ```typescript
     * // Get the document ID from a path.
     * field("__path__").documentId();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the documentId operation.
     */    documentId() {
        return new FunctionExpression("document_id", [ this ], "documentId");
    }
    /**
     *
     * Creates an expression that returns the parent document reference of a document reference.
     *
     * @example
     * ```typescript
     * // Get the parent document reference of a document reference.
     * field("__path__").parent();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the parent operation.
     */    parent() {
        return new FunctionExpression("parent", [ this ], "parent");
    }
    substring(e, t) {
        const n = __PRIVATE_valueToDefaultExpr$1(e);
        return new FunctionExpression("substring", void 0 === t ? [ this, n ] : [ this, n, __PRIVATE_valueToDefaultExpr$1(t) ], "substring");
    }
    arrayGet(e) {
        return new FunctionExpression("array_get", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "arrayGet");
    }
    /**
     *
     * Creates an expression that checks if a given expression produces an error.
     *
     * @example
     * ```typescript
     * // Check if the result of a calculation is an error
     * field("title").arrayContains(1).isError();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#BooleanExpression} representing the 'isError' check.
     */    isError() {
        return new FunctionExpression("is_error", [ this ], "isError").asBoolean();
    }
    ifError(e) {
        const t = new FunctionExpression("if_error", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "ifError");
        return e instanceof BooleanExpression ? t.asBoolean() : t;
    }
    /**
     *
     * Creates an expression that returns `true` if the result of this expression
     * is absent. Otherwise, returns `false` even if the value is `null`.
     *
     * @example
     * ```typescript
     * // Check if the field `value` is absent.
     * field("value").isAbsent();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#BooleanExpression} representing the 'isAbsent' check.
     */    isAbsent() {
        return new FunctionExpression("is_absent", [ this ], "isAbsent").asBoolean();
    }
    mapRemove(e) {
        return new FunctionExpression("map_remove", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "mapRemove");
    }
    /**
     *
     * Creates an expression that merges multiple map values.
     *
     * @example
     * ```
     * // Merges the map in the settings field with, a map literal, and a map in
     * // that is conditionally returned by another expression
     * field('settings').mapMerge({ enabled: true }, conditional(field('isAdmin'), { admin: true}, {})
     * ```
     *
     * @param secondMap - A required second map to merge. Represented as a literal or
     * an expression that returns a map.
     * @param otherMaps - Optional additional maps to merge. Each map is represented
     * as a literal or an expression that returns a map.
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the 'mapMerge' operation.
     */    mapMerge(e, ...t) {
        const n = __PRIVATE_valueToDefaultExpr$1(e), r = t.map(__PRIVATE_valueToDefaultExpr$1);
        return new FunctionExpression("map_merge", [ this, n, ...r ], "mapMerge");
    }
    pow(e) {
        return new FunctionExpression("pow", [ this, __PRIVATE_valueToDefaultExpr$1(e) ]);
    }
    trunc(e) {
        return void 0 === e ? new FunctionExpression("trunc", [ this ]) : new FunctionExpression("trunc", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "trunc");
    }
    round(e) {
        return void 0 === e ? new FunctionExpression("round", [ this ]) : new FunctionExpression("round", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "round");
    }
    /**
     * Creates an expression that returns the collection ID from a path.
     *
     * @example
     * ```typescript
     * // Get the collection ID from a path.
     * field("__path__").collectionId();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the collectionId operation.
     */    collectionId() {
        return new FunctionExpression("collection_id", [ this ]);
    }
    /**
     * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
     *
     * @example
     * ```typescript
     * // Get the length of the 'name' field.
     * field("name").length();
     *
     * // Get the number of items in the 'cart' array.
     * field("cart").length();
     * ```
     *
     * @returns A new `Expression` representing the length of the string, array, map, vector, or bytes.
     */    length() {
        return new FunctionExpression("length", [ this ]);
    }
    /**
     * Creates an expression that computes the natural logarithm of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the natural logarithm of the 'value' field.
     * field("value").ln();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the natural logarithm of the numeric value.
     */    ln() {
        return new FunctionExpression("ln", [ this ]);
    }
    /**
     * Creates an expression that computes the square root of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the square root of the 'value' field.
     * field("value").sqrt();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the square root of the numeric value.
     */    sqrt() {
        return new FunctionExpression("sqrt", [ this ]);
    }
    /**
     * Creates an expression that reverses a string.
     *
     * @example
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * field("myString").stringReverse();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the reversed string.
     */    stringReverse() {
        return new FunctionExpression("string_reverse", [ this ]);
    }
    ifAbsent(e) {
        return new FunctionExpression("if_absent", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "ifAbsent");
    }
    ifNull(e) {
        return new FunctionExpression("if_null", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "ifNull");
    }
    /**
     * Creates an expression that returns the first non-null, non-absent argument, without evaluating
     * the rest of the arguments. When all arguments are null or absent, returns the last argument.
     *
     * @example
     * ```typescript
     * // Returns the value of the first non-null, non-absent field among 'preferredName', 'fullName',
     * // or the last argument if all previous fields are null.
     * field("preferredName").coalesce(field("fullName"), "Anonymous");
     * ```
     *
     * @param replacement - The value to use if this expression evaluates to null.
     * @param others - Optional additional values to check if previous values are null.
     * @returns A new `Expression` representing the coalesce operation.
     */    coalesce(e, ...t) {
        return new FunctionExpression("coalesce", [ this, __PRIVATE_valueToDefaultExpr$1(e), ...t.map(__PRIVATE_valueToDefaultExpr$1) ], "coalesce");
    }
    join(e) {
        return new FunctionExpression("join", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "join");
    }
    /**
     * Creates an expression that computes the base-10 logarithm of a numeric value.
     *
     * @example
     * ```typescript
     * // Compute the base-10 logarithm of the 'value' field.
     * field("value").log10();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the base-10 logarithm of the numeric value.
     */    log10() {
        return new FunctionExpression("log10", [ this ]);
    }
    /**
     * Creates an expression that computes the sum of the elements in an array.
     *
     * @example
     * ```typescript
     * // Compute the sum of the elements in the 'scores' field.
     * field("scores").arraySum();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the sum of the elements in the array.
     */    arraySum() {
        return new FunctionExpression("sum", [ this ]);
    }
    split(e) {
        return new FunctionExpression("split", [ this, __PRIVATE_valueToDefaultExpr$1(e) ]);
    }
    timestampTruncate(e, t) {
        const n = [ this, __PRIVATE_valueToDefaultExpr$1(e) ];
        return t && n.push(__PRIVATE_valueToDefaultExpr$1(t)), new FunctionExpression("timestamp_trunc", n);
    }
    // TODO(search) enable with backend support
    // /**
    //  * Evaluates if the result of this `expression` is between
    //  * the `lowerBound` (inclusive) and `upperBound` (inclusive).
    //  *
    //  * @example
    //  * ```
    //  * // Evaluate if the 'tireWidth' is between 2.2 and 2.4
    //  * field('tireWidth').between(constant(2.2), constant(2.4))
    //  *
    //  * // This is functionally equivalent to
    //  * and(field('tireWidth').greaterThanOrEqual(contant(2.2)), field('tireWidth').lessThanOrEqual(constant(2.4)))
    //  * ```
    //  *
    //  * @param lowerBound - Lower bound (inclusive) of the range.
    //  * @param upperBound - Upper bound (inclusive) of the range.
    //  */
    // between(lowerBound: Expression, upperBound: Expression): BooleanExpression;
    // /**
    //  * Evaluates if the result of this `expression` is between
    //  * the `lowerBound` (inclusive) and `upperBound` (inclusive).
    //  *
    //  * @example
    //  * ```
    //  * // Evaluate if the 'tireWidth' is between 2.2 and 2.4
    //  * field('tireWidth').between(2.2, 2.4)
    //  *
    //  * // This is functionally equivalent to
    //  * and(field('tireWidth').greaterThanOrEqual(2.2), field('tireWidth').lessThanOrEqual(2.4))
    //  * ```
    //  *
    //  * @param lowerBound - Lower bound (inclusive) of the range.
    //  * @param upperBound - Upper bound (inclusive) of the range.
    //  */
    // between(lowerBound: unknown, upperBound: unknown): BooleanExpression;
    // between(lowerBound: unknown, upperBound: unknown): BooleanExpression {
    //   return new FunctionExpression('between', [
    //     this,
    //     valueToDefaultExpr(lowerBound),
    //     valueToDefaultExpr(upperBound)
    //   ]).asBoolean();
    // }
    // TODO(search) enable with backend support
    // /**
    //  * Evaluates to an HTML-formatted text snippet that renders terms matching
    //  * the search query in `<b>bold</b>`.
    //  *
    //  * @remarks This Expression can only be used within a `Search` stage.
    //  *
    //  * @param rquery Define the search query using the search domain-specific language (DSL).
    //  */
    // snippet(rquery: string): Expression;
    // /**
    //  * Evaluates to an HTML-formatted text snippet that renders terms matching
    //  * the search query in `<b>bold</b>`.
    //  *
    //  * @remarks This Expression can only be used within a `Search` stage.
    //  *
    //  * @param options Define how snippeting behaves.
    //  */
    // snippet(options: SnippetOptions): Expression;
    // snippet(queryOrOptions: string | SnippetOptions): Expression {
    //   const options: SnippetOptions = isString(queryOrOptions)
    //     ? { rquery: queryOrOptions }
    //     : queryOrOptions;
    //   const rquery = options.rquery;
    //   const internalOptions = {
    //     maxSnippetWidth: options.maxSnippetWidth,
    //     maxSnippets: options.maxSnippets,
    //     separator: options.separator
    //   };
    //   return new SnippetExpression([this, constant(rquery)], internalOptions);
    // }
    // TODO(new-expression): Add new expression method definitions above this line
    /**
     * Creates an {@link @firebase/firestore/pipelines#Ordering} that sorts documents in ascending order based on this expression.
     *
     * @example
     * ```typescript
     * // Sort documents by the 'name' field in ascending order
     * firestore.pipeline().collection("users")
     *   .sort(field("name").ascending());
     * ```
     *
     * @returns A new `Ordering` for ascending sorting.
     */
    ascending() {
        return ascending(this);
    }
    /**
     * Creates an {@link @firebase/firestore/pipelines#Ordering} that sorts documents in descending order based on this expression.
     *
     * @example
     * ```typescript
     * // Sort documents by the 'createdAt' field in descending order
     * firestore.pipeline().collection("users")
     *   .sort(field("createdAt").descending());
     * ```
     *
     * @returns A new `Ordering` for descending sorting.
     */    descending() {
        return descending(this);
    }
    /**
     * Assigns an alias to this expression.
     *
     * Aliases are useful for renaming fields in the output of a stage or for giving meaningful
     * names to calculated values.
     *
     * @example
     * ```typescript
     * // Calculate the total price and assign it the alias "totalPrice" and add it to the output.
     * firestore.pipeline().collection("items")
     *   .addFields(field("price").multiply(field("quantity")).as("totalPrice"));
     * ```
     *
     * @param name - The alias to assign to this expression.
     * @returns A new {@link @firebase/firestore/pipelines#AliasedExpression} that wraps this
     *     expression and associates it with the provided alias.
     */    as(e) {
        return new AliasedExpression(this, e, "as");
    }
}

/**
 *
 * A class that represents an aggregate function.
 */ class AggregateFunction {
    constructor(e, t) {
        this.name = e, this.params = t, this.exprType = "AggregateFunction", this._protoValueType = "ProtoValue";
    }
    /**
     * @internal
     * @private
     */    static _create(e, t, n) {
        const r = new AggregateFunction(e, t);
        return r._methodName = n, r;
    }
    /**
     * Assigns an alias to this AggregateFunction. The alias specifies the name that
     * the aggregated value will have in the output document.
     *
     * @example
     * ```typescript
     * // Calculate the average price of all items and assign it the alias "averagePrice".
     * firestore.pipeline().collection("items")
     *   .aggregate(field("price").average().as("averagePrice"));
     * ```
     *
     * @param name - The alias to assign to this AggregateFunction.
     * @returns A new {@link @firebase/firestore/pipelines#AliasedAggregate} that wraps this
     *     AggregateFunction and associates it with the provided alias.
     */    as(e) {
        return new AliasedAggregate(this, e, "as");
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            functionValue: {
                name: this.name,
                args: this.params.map((t => t._toProto(e)))
            }
        };
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        e = this._methodName ? e.ne({
            methodName: this._methodName
        }) : e, this.params.forEach((t => t._readUserData(e)));
    }
}

/**
 *
 * An AggregateFunction with alias.
 */ class AliasedAggregate {
    constructor(e, t, n) {
        this.aggregate = e, this.alias = t, this._methodName = n;
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        this.aggregate._readUserData(e);
    }
}

class AliasedExpression {
    constructor(e, t, n) {
        this.expr = e, this.alias = t, this._methodName = n, this.exprType = "AliasedExpression", 
        this.selectable = !0;
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        this.expr._readUserData(e);
    }
}

/**
 * @internal
 */ class __PRIVATE_ListOfExprs extends Expression {
    constructor(e, t) {
        super(), this.re = e, this._methodName = t, this.expressionType = "ListOfExpressions";
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            arrayValue: {
                values: this.re.map((t => t._toProto(e)))
            }
        };
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        this.re.forEach((t => t._readUserData(e)));
    }
}

/**
 *
 * Represents a reference to a field in a Firestore document, or outputs of a {@link @firebase/firestore/pipelines#Pipeline} stage.
 *
 * <p>Field references are used to access document field values in expressions and to specify fields
 * for sorting, filtering, and projecting data in Firestore pipelines.
 *
 * <p>You can create a `Field` instance using the static {@link @firebase/firestore/pipelines#field} method:
 *
 * @example
 * ```typescript
 * // Create a Field instance for the 'name' field
 * const nameField = field("name");
 *
 * // Create a Field instance for a nested field 'address.city'
 * const cityField = field("address.city");
 * ```
 */ class Field extends Expression {
    /**
     * @internal
     * @private
     * @hideconstructor
     * @param fieldPath
     */
    constructor(e, t) {
        super(), this.fieldPath = e, this._methodName = t, this.expressionType = "Field", 
        this.selectable = !0;
    }
    get fieldName() {
        return this.fieldPath.canonicalString();
    }
    get alias() {
        return this.fieldName;
    }
    get expr() {
        return this;
    }
    // TODO(search) enable with backend support
    // /**
    //  * Perform a full-text search on this field.
    //  *
    //  * @remarks This Expression can only be used within a `Search` stage.
    //  *
    //  * @param rquery Define the search query using the search domain-specific language (DSL).
    //  */
    // matches(rquery: string | Expression): BooleanExpression {
    //   return new FunctionExpression(
    //     'matches',
    //     [this, valueToDefaultExpr(rquery)],
    //     'matches'
    //   ).asBoolean();
    // }
    /**
     * @beta
     * Evaluates to the distance in meters between the location specified
     * by this field and the query location.
     *
     * @remarks This Expression can only be used within a `Search` stage.
     *
     * @param location - Compute distance to this GeoPoint.
     */
    geoDistance(e) {
        return new FunctionExpression("geo_distance", [ this, __PRIVATE_valueToDefaultExpr$1(e) ], "geoDistance");
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            fieldReferenceValue: this.fieldPath.canonicalString()
        };
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {}
}

function field(e) {
    return _field(e, "field");
}

function _field(e, t) {
    return new Field("string" == typeof e ? R === e ? documentId$1()._internalPath : __PRIVATE_fieldPathFromArgument("field", e) : e._internalPath, t);
}

/**
 * @internal
 *
 * Represents a constant value that can be used in a Firestore pipeline expression.
 *
 * You can create a `Constant` instance using the static {@link @firebase/firestore/pipelines#field} method:
 *
 * @example
 * ```typescript
 * // Create a Constant instance for the number 10
 * const ten = constant(10);
 *
 * // Create a Constant instance for the string "hello"
 * const hello = constant("hello");
 * ```
 */ class Constant extends Expression {
    /**
     * @private
     * @internal
     * @hideconstructor
     * @param value - The value of the constant.
     */
    constructor(e, t) {
        super(), this.value = e, this._methodName = t, this.expressionType = "Constant";
    }
    /**
     * @private
     * @internal
     */    static _fromProto(e) {
        const t = new Constant(e, void 0);
        return t._protoValue = e, t;
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return __PRIVATE_hardAssert(void 0 !== this._protoValue, 237), this._protoValue;
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        e = this._methodName ? e.ne({
            methodName: this._methodName
        }) : e, __PRIVATE_isFirestoreValue(this._protoValue) || (this._protoValue = __PRIVATE_parseData(this.value, e));
    }
}

function constant(e) {
    return __PRIVATE__constant(e, "constant");
}

/**
 * @internal
 * @private
 * @param value
 * @param methodName
 */ function __PRIVATE__constant(e, t) {
    const n = new Constant(e, t);
    return "boolean" == typeof e ? new __PRIVATE_BooleanConstant(n) : n;
}

/**
 * Internal only
 * @internal
 * @private
 */ class MapValue extends Expression {
    constructor(e, t) {
        super(), this.se = e, this._methodName = t, this.expressionType = "Constant";
    }
    _readUserData(e) {
        e = this._methodName ? e.ne({
            methodName: this._methodName
        }) : e, this.se.forEach((t => {
            t._readUserData(e);
        }));
    }
    _toProto(e) {
        return __PRIVATE_toMapValue(e, this.se);
    }
}

/**
 *
 * This class defines the base class for Firestore {@link @firebase/firestore/pipelines#Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link @firebase/firestore/pipelines#and}, {@link @firebase/firestore/pipelines#(equal:1)},
 * or the methods on {@link @firebase/firestore/pipelines#Expression} ({@link @firebase/firestore/pipelines#Expression.(equal:1)}, {@link @firebase/firestore/pipelines#Expression.(lessThan:1)}, etc.) to construct new Function instances.
 */ class FunctionExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(e, t, n, r) {
        super(), this.name = e, this.params = t, this.expressionType = "Function", 
        /**
         * @private
         * @internal
         */
        this._optionsProto = void 0, void 0 !== n && (this._methodName = n), void 0 !== r && (this._options = r);
    }
    /**
     * @private
     * @internal
     */    get _optionsUtil() {
        return new OptionsUtil({});
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        const t = {
            functionValue: {
                name: this.name,
                args: this.params.map((t => t._toProto(e)))
            }
        };
        return this._optionsProto && (t.functionValue.options = this._optionsProto), t;
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        e = this._methodName ? e.ne({
            methodName: this._methodName
        }) : e, this.params.forEach((t => t._readUserData(e))), this._options && (this._optionsProto = this._optionsUtil.getOptionsProto(e, this._options));
    }
}

/**
 *
 * An interface that represents a filter condition.
 */ class BooleanExpression extends Expression {
    get _methodName() {
        return this._expr._methodName;
    }
    /**
     * Creates an aggregation that finds the count of input documents satisfying
     * this boolean expression.
     *
     * @example
     * ```typescript
     * // Find the count of documents with a score greater than 90
     * field("score").greaterThan(90).countIf().as("highestScore");
     * ```
     *
     * @returns A new `AggregateFunction` representing the 'countIf' aggregation.
     */    countIf() {
        return AggregateFunction._create("count_if", [ this ], "countIf");
    }
    /**
     * Creates an expression that negates this boolean expression.
     *
     * @example
     * ```typescript
     * // Find documents where the 'tags' field does not contain 'completed'
     * field("tags").arrayContains("completed").not();
     * ```
     *
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the negated filter condition.
     */    not() {
        return new FunctionExpression("not", [ this ], "not").asBoolean();
    }
    /**
     * Creates a conditional expression that evaluates to the 'then' expression
     * if `this` expression evaluates to `true`,
     * or evaluates to the 'else' expression if `this` expressions evaluates `false`.
     *
     * @example
     * ```typescript
     * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
     * field("age").greaterThanOrEqual(18).conditional(constant("Adult"), constant("Minor"));
     * ```
     *
     * @param thenExpr - The expression to evaluate if the condition is true.
     * @param elseExpr - The expression to evaluate if the condition is false.
     * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the conditional expression.
     */    conditional(e, t) {
        return new FunctionExpression("conditional", [ this, e, t ], "conditional");
    }
    ifError(e) {
        const t = __PRIVATE_valueToDefaultExpr$1(e), n = new FunctionExpression("if_error", [ this, t ], "ifError");
        return t instanceof BooleanExpression ? n.asBoolean() : n;
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return this._expr._toProto(e);
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        this._expr._readUserData(e);
    }
}

class __PRIVATE_BooleanFunctionExpression extends BooleanExpression {
    constructor(e) {
        super(), this._expr = e, this.expressionType = "Function";
    }
}

class __PRIVATE_BooleanConstant extends BooleanExpression {
    constructor(e) {
        super(), this._expr = e, this.expressionType = "Constant";
    }
}

class __PRIVATE_BooleanField extends BooleanExpression {
    constructor(e) {
        super(), this._expr = e, this.expressionType = "Field";
    }
}

/**
 * Creates an aggregation that counts the number of stage inputs where the provided
 * boolean expression evaluates to true.
 *
 * @example
 * ```typescript
 * // Count the number of documents where 'is_active' field equals true
 * countIf(field("is_active").equal(true)).as("numActiveDocuments");
 * ```
 *
 * @param booleanExpr - The boolean expression to evaluate on each input.
 * @returns A new `AggregateFunction` representing the 'countIf' aggregation.
 */ function countIf(e) {
    return e.countIf();
}

function arrayGet(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayGet(__PRIVATE_valueToDefaultExpr$1(t));
}

/**
 *
 * Creates an expression that checks if a given expression produces an error.
 *
 * @example
 * ```typescript
 * // Check if the result of a calculation is an error
 * isError(field("title").arrayContains(1));
 * ```
 *
 * @param value - The expression to check.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the 'isError' check.
 */ function isError(e) {
    return e.isError().asBoolean();
}

function ifError(e, t) {
    return e instanceof BooleanExpression && t instanceof BooleanExpression ? e.ifError(t).asBoolean() : e.ifError(__PRIVATE_valueToDefaultExpr$1(t));
}

function isAbsent(e) {
    return __PRIVATE_fieldOrExpression$1(e).isAbsent();
}

function mapRemove(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).mapRemove(__PRIVATE_valueToDefaultExpr$1(t));
}

function mapMerge(e, t, ...n) {
    const r = __PRIVATE_valueToDefaultExpr$1(t), s = n.map(__PRIVATE_valueToDefaultExpr$1);
    return __PRIVATE_fieldOrExpression$1(e).mapMerge(r, ...s);
}

function documentId(e) {
    return __PRIVATE_valueToDefaultExpr$1(e).documentId();
}

function parent(e) {
    return __PRIVATE_valueToDefaultExpr$1(e).parent();
}

function substring(e, t, n) {
    const r = __PRIVATE_fieldOrExpression$1(e), s = __PRIVATE_valueToDefaultExpr$1(t), i = void 0 === n ? void 0 : __PRIVATE_valueToDefaultExpr$1(n);
    return r.substring(s, i);
}

function add(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).add(__PRIVATE_valueToDefaultExpr$1(t));
}

function subtract(e, t) {
    const n = "string" == typeof e ? field(e) : e, r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.subtract(r);
}

function multiply(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).multiply(__PRIVATE_valueToDefaultExpr$1(t));
}

function divide(e, t) {
    const n = "string" == typeof e ? field(e) : e, r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.divide(r);
}

function mod(e, t) {
    const n = "string" == typeof e ? field(e) : e, r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.mod(r);
}

/**
 *
 * Creates an expression that creates a Firestore map value from an input object.
 *
 * @example
 * ```typescript
 * // Create a map from the input object and reference the 'baz' field value from the input document.
 * map({foo: 'bar', baz: field('baz')}).as('data');
 * ```
 *
 * @param elements - The input map to evaluate in the expression.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the map function.
 */ function map(e) {
    return __PRIVATE__map(e);
}

function __PRIVATE__map(e, t) {
    const n = [];
    for (const t in e) if (Object.prototype.hasOwnProperty.call(e, t)) {
        const r = e[t];
        n.push(constant(t)), n.push(__PRIVATE_valueToDefaultExpr$1(r));
    }
    return new FunctionExpression("map", n, "map");
}

/**
 * Internal use only
 * Converts a plainObject to a mapValue in the proto representation,
 * rather than a functionValue+map that is the result of the map(...) function.
 * This behaves different from constant(plainObject) because it
 * traverses the input object, converts values in the object to expressions,
 * and calls _readUserData on each of these expressions.
 * @private
 * @internal
 * @param plainObject
 */
/**
 *
 * Creates an expression that creates a Firestore array value from an input array.
 *
 * @example
 * ```typescript
 * // Create an array value from the input array and reference the 'baz' field value from the input document.
 * array(['bar', field('baz')]).as('foo');
 * ```
 *
 * @param elements - The input array to evaluate in the expression.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the array function.
 */
function array(e) {
    return function __PRIVATE__array(e, t) {
        return new FunctionExpression("array", e.map((e => __PRIVATE_valueToDefaultExpr$1(e))), t);
    }(e, "array");
}

function equal(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.equal(r);
}

function notEqual(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.notEqual(r);
}

function lessThan(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.lessThan(r);
}

function lessThanOrEqual(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.lessThanOrEqual(r);
}

function greaterThan(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.greaterThan(r);
}

function greaterThanOrEqual(e, t) {
    const n = e instanceof Expression ? e : field(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.greaterThanOrEqual(r);
}

function arrayConcat(e, t, ...n) {
    const r = n.map((e => __PRIVATE_valueToDefaultExpr$1(e)));
    return __PRIVATE_fieldOrExpression$1(e).arrayConcat(__PRIVATE_fieldOrExpression$1(t), ...r);
}

function arrayContains(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.arrayContains(r);
}

function arrayContainsAny(e, t) {
    // @ts-ignore implementation accepts both types
    return __PRIVATE_fieldOrExpression$1(e).arrayContainsAny(t);
}

function arrayContainsAll(e, t) {
    // @ts-ignore implementation accepts both types
    return __PRIVATE_fieldOrExpression$1(e).arrayContainsAll(t);
}

function arrayLength(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayLength();
}

function equalAny(e, t) {
    // @ts-ignore implementation accepts both types
    return __PRIVATE_fieldOrExpression$1(e).equalAny(t);
}

function notEqualAny(e, t) {
    // @ts-ignore implementation accepts both types
    return __PRIVATE_fieldOrExpression$1(e).notEqualAny(t);
}

/**
 *
 * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on multiple BooleanExpressions.
 *
 * @example
 * ```typescript
 * // Check if only one of the conditions is true: 'age' greater than 18, 'city' is "London",
 * // or 'status' is "active".
 * const condition = xor(
 *     greaterThan("age", 18),
 *     equal("city", "London"),
 *     equal("status", "active"));
 * ```
 *
 * @param first - The first condition.
 * @param second - The second condition.
 * @param additionalConditions - Additional conditions to 'XOR' together.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the logical 'XOR' operation.
 */ function xor(e, t, ...n) {
    return new FunctionExpression("xor", [ e, t, ...n ], "xor").asBoolean();
}

/**
 *
 * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
 * and an 'else' expression if the condition is false.
 *
 * @example
 * ```typescript
 * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
 * conditional(
 *     greaterThan("age", 18), constant("Adult"), constant("Minor"));
 * ```
 *
 * @param condition - The condition to evaluate.
 * @param thenExpr - The expression to evaluate if the condition is true.
 * @param elseExpr - The expression to evaluate if the condition is false.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the conditional expression.
 */ function conditional(e, t, n) {
    return new FunctionExpression("conditional", [ e, t, n ], "conditional");
}

/**
 *
 * Creates an expression that negates a filter condition.
 *
 * @example
 * ```typescript
 * // Find documents where the 'completed' field is NOT true
 * not(equal("completed", true));
 * ```
 *
 * @param booleanExpr - The filter condition to negate.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the negated filter condition.
 */ function not(e) {
    return e.not();
}

function logicalMaximum(e, t, ...n) {
    return __PRIVATE_fieldOrExpression$1(e).logicalMaximum(__PRIVATE_valueToDefaultExpr$1(t), ...n.map((e => __PRIVATE_valueToDefaultExpr$1(e))));
}

function logicalMinimum(e, t, ...n) {
    return __PRIVATE_fieldOrExpression$1(e).logicalMinimum(__PRIVATE_valueToDefaultExpr$1(t), ...n.map((e => __PRIVATE_valueToDefaultExpr$1(e))));
}

function exists(e) {
    return __PRIVATE_fieldOrExpression$1(e).exists();
}

function reverse(e) {
    return __PRIVATE_fieldOrExpression$1(e).reverse();
}

function byteLength(e) {
    return __PRIVATE_fieldOrExpression$1(e).byteLength();
}

function exp(e) {
    return __PRIVATE_fieldOrExpression$1(e).exp();
}

function ceil(e) {
    return __PRIVATE_fieldOrExpression$1(e).ceil();
}

function floor(e) {
    return __PRIVATE_fieldOrExpression$1(e).floor();
}

/**
 * Creates an aggregation that counts the number of distinct values of a field.
 *
 * @param expr - The expression or field to count distinct values of.
 * @returns A new `AggregateFunction` representing the 'count_distinct' aggregation.
 */ function countDistinct(e) {
    return __PRIVATE_fieldOrExpression$1(e).countDistinct();
}

function charLength(e) {
    return __PRIVATE_fieldOrExpression$1(e).charLength();
}

function like(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.like(r);
}

function regexContains(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.regexContains(r);
}

function arrayFilter(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).arrayFilter(t, n);
}

function arrayTransform(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).arrayTransform(t, n);
}

function arrayTransformWithIndex(e, t, n, r) {
    return __PRIVATE_fieldOrExpression$1(e).arrayTransformWithIndex(t, n, r);
}

function arraySlice(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).arraySlice(t, n);
}

function arrayFirst(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayFirst();
}

function arrayFirstN(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayFirstN(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayLast(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayLast();
}

function arrayLastN(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayLastN(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayMaximum(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayMaximum();
}

function arrayMaximumN(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayMaximumN(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayMinimum(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayMinimum();
}

function arrayMinimumN(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayMinimumN(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayIndexOf(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayIndexOf(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayLastIndexOf(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayLastIndexOf(__PRIVATE_valueToDefaultExpr$1(t));
}

function arrayIndexOfAll(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).arrayIndexOfAll(__PRIVATE_valueToDefaultExpr$1(t));
}

function regexFind(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.regexFind(r);
}

function regexFindAll(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.regexFindAll(r);
}

function regexMatch(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.regexMatch(r);
}

function stringContains(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_valueToDefaultExpr$1(t);
    return n.stringContains(r);
}

function startsWith(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).startsWith(__PRIVATE_valueToDefaultExpr$1(t));
}

function endsWith(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).endsWith(__PRIVATE_valueToDefaultExpr$1(t));
}

function toLower(e) {
    return __PRIVATE_fieldOrExpression$1(e).toLower();
}

function toUpper(e) {
    return __PRIVATE_fieldOrExpression$1(e).toUpper();
}

function trim(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).trim(t);
}

function ltrim(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).ltrim(t);
}

function rtrim(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).rtrim(t);
}

function type(e) {
    return __PRIVATE_fieldOrExpression$1(e).type();
}

function isType(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).isType(t);
}

function stringConcat(e, t, ...n) {
    return __PRIVATE_fieldOrExpression$1(e).stringConcat(__PRIVATE_valueToDefaultExpr$1(t), ...n.map(__PRIVATE_valueToDefaultExpr$1));
}

function stringIndexOf(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).stringIndexOf(t);
}

function stringRepeat(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).stringRepeat(t);
}

function stringReplaceAll(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).stringReplaceAll(t, n);
}

function stringReplaceOne(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).stringReplaceOne(t, n);
}

function mapGet(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).mapGet(t);
}

function mapSet(e, t, n, ...r) {
    return __PRIVATE_fieldOrExpression$1(e).mapSet(t, n, ...r);
}

function mapKeys(e) {
    return __PRIVATE_fieldOrExpression$1(e).mapKeys();
}

function mapValues(e) {
    return __PRIVATE_fieldOrExpression$1(e).mapValues();
}

function mapEntries(e) {
    return __PRIVATE_fieldOrExpression$1(e).mapEntries();
}

/**
 * Creates an aggregation that counts the total number of stage inputs.
 *
 * @example
 * ```typescript
 * // Count the total number of input documents
 * countAll().as("totalDocument");
 * ```
 *
 * @returns A new {@link @firebase/firestore/pipelines#AggregateFunction} representing the 'countAll' aggregation.
 */ function countAll() {
    return AggregateFunction._create("count", [], "count");
}

function count(e) {
    return __PRIVATE_fieldOrExpression$1(e).count();
}

function sum(e) {
    return __PRIVATE_fieldOrExpression$1(e).sum();
}

function average(e) {
    return __PRIVATE_fieldOrExpression$1(e).average();
}

function minimum(e) {
    return __PRIVATE_fieldOrExpression$1(e).minimum();
}

function maximum(e) {
    return __PRIVATE_fieldOrExpression$1(e).maximum();
}

function first(e) {
    return __PRIVATE_fieldOrExpression$1(e).first();
}

function last(e) {
    return __PRIVATE_fieldOrExpression$1(e).last();
}

function arrayAgg(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayAgg();
}

function arrayAggDistinct(e) {
    return __PRIVATE_fieldOrExpression$1(e).arrayAggDistinct();
}

function cosineDistance(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_vectorToExpr$1(t);
    return n.cosineDistance(r);
}

function dotProduct(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_vectorToExpr$1(t);
    return n.dotProduct(r);
}

function euclideanDistance(e, t) {
    const n = __PRIVATE_fieldOrExpression$1(e), r = __PRIVATE_vectorToExpr$1(t);
    return n.euclideanDistance(r);
}

function vectorLength(e) {
    return __PRIVATE_fieldOrExpression$1(e).vectorLength();
}

function unixMicrosToTimestamp(e) {
    return __PRIVATE_fieldOrExpression$1(e).unixMicrosToTimestamp();
}

function timestampToUnixMicros(e) {
    return __PRIVATE_fieldOrExpression$1(e).timestampToUnixMicros();
}

function unixMillisToTimestamp(e) {
    return __PRIVATE_fieldOrExpression$1(e).unixMillisToTimestamp();
}

function timestampToUnixMillis(e) {
    return __PRIVATE_fieldOrExpression$1(e).timestampToUnixMillis();
}

function unixSecondsToTimestamp(e) {
    return __PRIVATE_fieldOrExpression$1(e).unixSecondsToTimestamp();
}

function timestampToUnixSeconds(e) {
    return __PRIVATE_fieldOrExpression$1(e).timestampToUnixSeconds();
}

function timestampAdd(e, t, n) {
    const r = __PRIVATE_fieldOrExpression$1(e), s = __PRIVATE_valueToDefaultExpr$1(t), i = __PRIVATE_valueToDefaultExpr$1(n);
    return r.timestampAdd(s, i);
}

function timestampSubtract(e, t, n) {
    const r = __PRIVATE_fieldOrExpression$1(e), s = __PRIVATE_valueToDefaultExpr$1(t), i = __PRIVATE_valueToDefaultExpr$1(n);
    return r.timestampSubtract(s, i);
}

/**
 *
 * Creates an expression that evaluates to the current server timestamp.
 *
 * @example
 * ```typescript
 * // Get the current server timestamp
 * currentTimestamp()
 * ```
 *
 * @returns A new Expression representing the current server timestamp.
 */ function currentTimestamp() {
    return new FunctionExpression("current_timestamp", [], "currentTimestamp");
}

/**
 *
 * Creates an expression that performs a logical 'AND' operation on multiple filter conditions.
 *
 * @example
 * ```typescript
 * // Check if the 'age' field is greater than 18 AND the 'city' field is "London" AND
 * // the 'status' field is "active"
 * const condition = and(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
 * ```
 *
 * @param first - The first filter condition.
 * @param second - The second filter condition.
 * @param more - Additional filter conditions to 'AND' together.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the logical 'AND' operation.
 */ function and(e, t, ...n) {
    return new FunctionExpression("and", [ e, t, ...n ], "and").asBoolean();
}

/**
 *
 * Creates an expression that performs a logical 'OR' operation on multiple filter conditions.
 *
 * @example
 * ```typescript
 * // Check if the 'age' field is greater than 18 OR the 'city' field is "London" OR
 * // the 'status' field is "active"
 * const condition = or(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
 * ```
 *
 * @param first - The first filter condition.
 * @param second - The second filter condition.
 * @param more - Additional filter conditions to 'OR' together.
 * @returns A new {@link @firebase/firestore/pipelines#Expression} representing the logical 'OR' operation.
 */ function or(e, t, ...n) {
    return new FunctionExpression("or", [ e, t, ...n ], "xor").asBoolean();
}

/**
 *
 * Creates an expression that performs a logical 'NOR' operation on multiple filter conditions.
 *
 * @example
 * ```typescript
 * // Check if neither the 'age' field is greater than 18 nor the 'city' field is "London"
 * const condition = nor(
 *   greaterThan("age", 18),
 *   equal("city", "London")
 * );
 * ```
 *
 * @param first - The first filter condition.
 * @param second - The second filter condition.
 * @param more - Additional filter conditions to 'NOR' together.
 * @returns A new {@link @firebase/firestore/pipelines#BooleanExpression} representing the logical 'NOR' operation.
 */ function nor(e, t, ...n) {
    return new FunctionExpression("nor", [ e, t, ...n ], "nor").asBoolean();
}

function pow(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).pow(t);
}

/**
 *
 * Creates an expression that generates a random number between 0.0 and 1.0 but not including 1.0.
 *
 * @example
 * ```typescript
 * // Generate a random number between 0.0 and 1.0.
 * rand();
 * ```
 *
 * @returns A new `Expression` representing the rand operation.
 */ function rand() {
    return new FunctionExpression("rand", [], "rand");
}

function round(e, t) {
    return void 0 === t ? __PRIVATE_fieldOrExpression$1(e).round() : __PRIVATE_fieldOrExpression$1(e).round(__PRIVATE_valueToDefaultExpr$1(t));
}

function trunc(e, t) {
    return void 0 === t ? __PRIVATE_fieldOrExpression$1(e).trunc() : __PRIVATE_fieldOrExpression$1(e).trunc(__PRIVATE_valueToDefaultExpr$1(t));
}

function collectionId(e) {
    return __PRIVATE_fieldOrExpression$1(e).collectionId();
}

function length(e) {
    return __PRIVATE_fieldOrExpression$1(e).length();
}

function ln(e) {
    return __PRIVATE_fieldOrExpression$1(e).ln();
}

function log(e, t) {
    return new FunctionExpression("log", [ __PRIVATE_fieldOrExpression$1(e), __PRIVATE_valueToDefaultExpr$1(t) ]);
}

function sqrt(e) {
    return __PRIVATE_fieldOrExpression$1(e).sqrt();
}

function stringReverse(e) {
    return __PRIVATE_fieldOrExpression$1(e).stringReverse();
}

function concat(e, t, ...n) {
    return new FunctionExpression("concat", [ __PRIVATE_fieldOrExpression$1(e), __PRIVATE_valueToDefaultExpr$1(t), ...n.map(__PRIVATE_valueToDefaultExpr$1) ]);
}

function abs(e) {
    return __PRIVATE_fieldOrExpression$1(e).abs();
}

function ifAbsent(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).ifAbsent(__PRIVATE_valueToDefaultExpr$1(t));
}

function ifNull(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).ifNull(t);
}

function coalesce(e, t, ...n) {
    return __PRIVATE_fieldOrExpression$1(e).coalesce(t, ...n);
}

/**
 * Creates an expression that evaluates to the result corresponding to the first true condition.
 *
 * @remarks
 * This function behaves like a `switch` statement. It accepts an alternating sequence of conditions
 * and their corresponding results.
 * If an odd number of arguments is provided, the final argument serves as a default fallback result.
 * If no default is provided and no condition evaluates to true, it throws an error.
 *
 * @example
 * ```typescript
 * // Return "Active" if field "status" is 1, "Pending" if field "status" is 2,
 * // and default to "Unknown" if none of the conditions are true.
 * switchOn(
 *   equal(field("status"), 1), constant("Active"),
 *   equal(field("status"), 2), constant("Pending"),
 *   constant("Unknown")
 * )
 * ```
 *
 * @param condition - The first condition to check.
 * @param result - The result if the first condition is true.
 * @param others - Additional conditions and results, and optionally a default value.
 * @returns A new Expression representing the switch operation.
 */ function switchOn(e, t, ...n) {
    return new FunctionExpression("switch_on", [ __PRIVATE_valueToDefaultExpr$1(e), __PRIVATE_valueToDefaultExpr$1(t), ...n.map(__PRIVATE_valueToDefaultExpr$1) ], "switchOn");
}

function join(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).join(__PRIVATE_valueToDefaultExpr$1(t));
}

function log10(e) {
    return __PRIVATE_fieldOrExpression$1(e).log10();
}

function arraySum(e) {
    return __PRIVATE_fieldOrExpression$1(e).arraySum();
}

function split(e, t) {
    return __PRIVATE_fieldOrExpression$1(e).split(__PRIVATE_valueToDefaultExpr$1(t));
}

function timestampTruncate(e, t, n) {
    const r = __PRIVATE_isString(t) ? __PRIVATE_valueToDefaultExpr$1(t) : t;
    return __PRIVATE_fieldOrExpression$1(e).timestampTruncate(r, n);
}

/**
 * @public
 * Creates an expression that retrieves the value of a variable bound via `define()`.
 *
 * @example
 * ```typescript
 * db.pipeline().collection("products")
 *   .define(
 *     field("price").multiply(0.9).as("discountedPrice"),
 *     field("stock").add(10).as("newStock")
 *   )
 *   .where(variable("discountedPrice").lessThan(100))
 *   .select(field("name"), variable("newStock"));
 * ```
 *
 * @param name - The name of the variable to retrieve.
 * @returns An {@link @firebase/firestore/pipelines#Expression} representing the variable's value.
 */ function variable(e) {
    return new __PRIVATE_VariableExpression(e);
}

/**
 * @internal
 *
 * Expression representing a variable reference. This evaluates to the value of a variable
 * defined in a pipeline.
 */ class __PRIVATE_VariableExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(e) {
        super(), this.name = e, this.expressionType = "Variable";
    }
    /**
     * @internal
     */    _toProto(e) {
        return {
            variableReferenceValue: this.name
        };
    }
    /**
     * @internal
     */    _readUserData(e) {}
}

/**
 * @public
 * Creates an expression that represents the current document being processed.
 *
 * @example
 * ```typescript
 * // Define the current document as a variable "doc"
 * firestore.pipeline().collection("books")
 *     .define(currentDocument().as("doc"))
 *     // Access a field from the defined document variable
 *     .select(variable("doc").mapGet("title"));
 * ```
 *
 * @returns An {@link @firebase/firestore/pipelines#Expression} representing the current document.
 */ function currentDocument() {
    return new FunctionExpression("current_document", []);
}

/**
 * @internal
 */
/**
 * @internal
 */
class __PRIVATE_PipelineValueExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(e) {
        super(), this.pipeline = e, this.expressionType = "PipelineValue";
    }
    /**
     * @internal
     */    _toProto(e) {
        return __PRIVATE_toPipelineValue(this.pipeline._toProto(e));
    }
    /**
     * @internal
     */    _readUserData(e) {
        this.pipeline._readUserData(e);
    }
}

function timestampDiff(e, t, n) {
    const r = __PRIVATE_fieldOrExpression$1(e), s = __PRIVATE_fieldOrExpression$1(t), i = __PRIVATE_valueToDefaultExpr$1(n);
    return r.timestampDiff(s, i);
}

function timestampExtract(e, t, n) {
    return __PRIVATE_fieldOrExpression$1(e).timestampExtract(__PRIVATE_valueToDefaultExpr$1(t), n);
}

// TODO(search) enable with backend support
// /**
//  * Perform a full-text search on the specified field.
//  *
//  * @remarks This Expression can only be used within a `Search` stage.
//  *
//  * @example
//  * ```typescript
//  * db.pipeline().collection('restaurants').search({
//  *   query: matches('menu', 'waffles')
//  * })
//  * ```
//  *
//  * @param searchField Search the specified field.
//  * @param rquery Define the search query using the search domain-specific language (DSL).
//  */
// export function matches(
//   searchField: string | Field,
//   rquery: string | Expression
// ): BooleanExpression {
//   return toField(searchField).matches(rquery);
// }
/**
 * @beta
 * Perform a full-text search on all indexed search fields in the document.
 *
 * @remarks This Expression can only be used within a `Search` stage.
 *
 * @example
 * ```typescript
 * db.pipeline().collection('restaurants').search({
 *   query: documentMatches('waffles OR pancakes')
 * })
 * ```
 *
 * @param rquery Define the search query using the search domain-specific language (DSL).
 */ function documentMatches(e) {
    return new FunctionExpression("document_matches", [ __PRIVATE_valueToDefaultExpr$1(e) ], "documentMatches").asBoolean();
}

/**
 * @beta
 *
 * Evaluates to the search score that reflects the topicality of the document
 * to all of the text predicates (for example: `documentMatches`)
 * in the search query. If `SearchOptions.query` is not set or does not contain
 * any text predicates, then this topicality score will always be `0`.
 *
 * @example
 * ```typescript
 * db.pipeline().collection('restaurants').search({
 *   query: 'waffles',
 *   sort: score().descending()
 * })
 * ```
 *
 * @remarks This Expression can only be used within a `Search` stage.
 */ function score() {
    return new FunctionExpression("score", [], "score");
}

// TODO(search) enable with backend support
// /**
//  * Options defining how a snippet expression is evaluated.
//  */
// export interface SnippetOptions {
//   /**
//    * Define the search query using the search domain-specific language (DSL).
//    */
//   rquery: string;

//   /**
//    * The maximum width of the string estimated for a variable width font. The
//    * unit is tenths of ems. The default is `160`.
//    */
//   maxSnippetWidth?: number;

//   /**
//    * The maximum number of non-contiguous pieces of text in the returned snippet.
//    * The default is `1`.
//    */
//   maxSnippets?: number;

//   /**
//    * The string to join the pieces. The default value is '\n'
//    */
//   separator?: string;
// }

// /**
//  * Evaluates to an HTML-formatted text snippet that highlights terms matching
//  * the search query in `<b>bold</b>`.
//  *
//  * @remarks This Expression can only be used within a `Search` stage.
//  *
//  * @example
//  * ```typescript
//  * db.pipeline().collection('restaurants').search({
//  *   query: 'waffles',
//  *   addFields: { snippet: snippet('menu', 'waffles') }
//  * })
//  * ```
//  *
//  * @param searchField Search the specified field for matching terms.
//  * @param rquery Define the search query using the search domain-specific language (DSL).
//  */
// export function snippet(
//   searchField: string | Field,
//   rquery: string
// ): Expression;

// /**
//  * Evaluates to an HTML-formatted text snippet that highlights terms matching
//  * the search query in `<b>bold</b>`.
//  *
//  * @remarks This Expression can only be used within a `Search` stage.
//  *
//  * @param searchField Search the specified field for matching terms.
//  * @param options Define the search query using the search domain-specific language (DSL).
//  */
// export function snippet(
//   searchField: string | Field,
//   options: SnippetOptions
// ): Expression;
// export function snippet(
//   field: string | Field,
//   queryOrOptions: string | SnippetOptions
// ): Expression {
//   return toField(field).snippet(
//     isString(queryOrOptions) ? { rquery: queryOrOptions } : queryOrOptions
//   );
// }
/**
 * @beta
 * Evaluates to the distance in meters between the location in the specified
 * field and the query location.
 *
 * @remarks This Expression can only be used within a `Search` stage.
 *
 * @example
 * ```typescript
 * db.pipeline().collection('restaurants').search({
 *   query: 'waffles',
 *   sort: geoDistance('location', new GeoPoint(37.0, -122.0)).ascending()
 * })
 * ```
 *
 * @param fieldName - Specifies the field in the document which contains
 * the first GeoPoint for distance computation.
 * @param location - Compute distance to this GeoPoint.
 */ function geoDistance(e, t) {
    return __PRIVATE_toField(e).geoDistance(t);
}

function ascending(e) {
    return new Ordering(__PRIVATE_fieldOrExpression$1(e), "ascending", "ascending");
}

function descending(e) {
    return new Ordering(__PRIVATE_fieldOrExpression$1(e), "descending", "descending");
}

/**
 *
 * Represents an ordering criterion for sorting documents in a Firestore pipeline.
 *
 * You create `Ordering` instances using the `ascending` and `descending` helper functions.
 */ class Ordering {
    constructor(e, t, n) {
        this.expr = e, this.direction = t, this._methodName = n, this._protoValueType = "ProtoValue";
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            mapValue: {
                fields: {
                    direction: __PRIVATE_toStringValue(this.direction),
                    expression: this.expr._toProto(e)
                }
            }
        };
    }
    /**
     * @private
     * @internal
     */    _readUserData(e) {
        this.expr._readUserData(e);
    }
}

function __PRIVATE_isSelectable(e) {
    const t = e;
    return t.selectable && __PRIVATE_isString(t.alias) && __PRIVATE_isExpr(t.expr);
}

function __PRIVATE_isOrdering(e) {
    const t = e;
    return null != t && __PRIVATE_isExpr(t.expr) && ("ascending" === t.direction || "descending" === t.direction);
}

function __PRIVATE_isAliasedAggregate(e) {
    const t = e;
    return __PRIVATE_isString(t.alias) && t.aggregate instanceof AggregateFunction;
}

function __PRIVATE_isExpr(e) {
    return e instanceof Expression;
}

function __PRIVATE_isBooleanExpr(e) {
    return e instanceof BooleanExpression;
}

function __PRIVATE_isAliasedExpr(e) {
    return e instanceof AliasedExpression;
}

function __PRIVATE_isField(e) {
    return e instanceof Field;
}

function __PRIVATE_toField(e) {
    if (__PRIVATE_isString(e)) {
        return field(e);
    }
    return e;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint @typescript-eslint/no-explicit-any: 0 */ function __PRIVATE_toPipelineBooleanExpr(e) {
    if (e instanceof FieldFilter) {
        const t = field(e.field.toString()), n = e.value;
        // Comparison filters
                switch (e.op) {
          case "<" /* Operator.LESS_THAN */ :
            return and(t.exists(), t.lessThan(Constant._fromProto(n)));

          case "<=" /* Operator.LESS_THAN_OR_EQUAL */ :
            return and(t.exists(), t.lessThanOrEqual(Constant._fromProto(n)));

          case ">" /* Operator.GREATER_THAN */ :
            return and(t.exists(), t.greaterThan(Constant._fromProto(n)));

          case ">=" /* Operator.GREATER_THAN_OR_EQUAL */ :
            return and(t.exists(), t.greaterThanOrEqual(Constant._fromProto(n)));

          case "==" /* Operator.EQUAL */ :
            return and(t.exists(), t.equal(Constant._fromProto(n)));

          case "!=" /* Operator.NOT_EQUAL */ :
            return t.notEqual(Constant._fromProto(n));

          case "array-contains" /* Operator.ARRAY_CONTAINS */ :
            return and(t.exists(), t.arrayContains(Constant._fromProto(n)));

          case "in" /* Operator.IN */ :
            {
                const e = n?.arrayValue?.values?.map((e => Constant._fromProto(e)));
                return e ? 1 === e.length ? and(t.exists(), t.equal(e[0])) : and(t.exists(), t.equalAny(e)) : and(t.exists(), t.equalAny([]));
            }

          case "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */ :
            {
                const e = n?.arrayValue?.values?.map((e => Constant._fromProto(e)));
                return and(t.exists(), t.arrayContainsAny(e));
            }

          case "not-in" /* Operator.NOT_IN */ :
            {
                const e = n?.arrayValue?.values?.map((e => Constant._fromProto(e)));
                return e ? 1 === e.length ? t.notEqual(e[0]) : t.notEqualAny(e) : t.notEqualAny([]);
            }

          default:
            fail(36935);
        }
    } else if (e instanceof CompositeFilter) switch (e.op) {
      case "and" /* CompositeOperator.AND */ :
        {
            const t = e.getFilters().map((e => __PRIVATE_toPipelineBooleanExpr(e)));
            return and(t[0], t[1], ...t.slice(2));
        }

      case "or" /* CompositeOperator.OR */ :
        {
            const t = e.getFilters().map((e => __PRIVATE_toPipelineBooleanExpr(e)));
            return or(t[0], t[1], ...t.slice(2));
        }

      default:
        fail(35306);
    }
    throw new Error(`Failed to convert filter to pipeline conditions: ${e}`);
}

function __PRIVATE_toPipeline(e, t) {
    let n;
    n = __PRIVATE_isCollectionGroupQuery(e) ? t.pipeline().collectionGroup(e.collectionGroup) : __PRIVATE_isDocumentQuery(e) ? t.pipeline().documents([ doc(t, e.path.canonicalString()) ]) : t.pipeline().collection(e.path.canonicalString());
    // filters
        for (const t of e.filters) n = n.where(__PRIVATE_toPipelineBooleanExpr(t));
    // orders
        const r = __PRIVATE_queryNormalizedOrderBy(e), s = e.explicitOrderBy.map((e => field(e.field.canonicalString()).exists()));
    if (s.length > 0) {
        const e = 1 === s.length ? s[0] : and(s[0], s[1], ...s.slice(2));
        n = n.where(e);
    }
    const i = r.map((e => "asc" /* Direction.ASCENDING */ === e.dir ? field(e.field.canonicalString()).ascending() : field(e.field.canonicalString()).descending()));
    if (i.length > 0) if ("L" /* LimitType.Last */ === e.limitType) {
        const t = function __PRIVATE_reverseOrderings(e) {
            return e.map((e => new Ordering(e.expr, "ascending" === e.direction ? "descending" : "ascending", void 0)));
        }(i);
        n = n.sort(t[0], ...t.slice(1)), 
        // cursors
        null !== e.startAt && (n = n.where(__PRIVATE_whereConditionsFromCursor(e.startAt, i, "after"))), 
        null !== e.endAt && (n = n.where(__PRIVATE_whereConditionsFromCursor(e.endAt, i, "before"))), 
        n = n.limit(e.limit), n = n.sort(i[0], ...i.slice(1));
    } else n = n.sort(i[0], ...i.slice(1)), null !== e.startAt && (n = n.where(__PRIVATE_whereConditionsFromCursor(e.startAt, i, "after"))), 
    null !== e.endAt && (n = n.where(__PRIVATE_whereConditionsFromCursor(e.endAt, i, "before"))), 
    null !== e.limit && (n = n.limit(e.limit));
    return n;
}

function __PRIVATE_whereConditionsFromCursor(e, t, n) {
    // The filterFunc is either greater than or less than
    const r = "before" === n ? lessThan : greaterThan, s = e.position.map((e => Constant._fromProto(e))), i = s.length;
    let o = t[i - 1].expr, a = s[i - 1], u = r(o, a);
    e.inclusive && (
    // When the cursor bound is inclusive, then the last bound
    // can be equal to the value, otherwise it's not equal
    u = or(u, o.equal(a)));
    // Iterate backwards over the remaining bounds, adding
    // a condition for each one
        for (let e = i - 2; e >= 0; e--) o = t[e].expr, a = s[e], 
    // For each field in the orderings, the condition is either
    // a) lt|gt the cursor value,
    // b) or equal the cursor value and lt|gt the cursor values for other fields
    u = or(r(o, a), and(o.equal(a), u));
    return u;
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @deprecated use selectablesToObject instead
 * @param selectables
 */ function __PRIVATE_selectablesToMap(e) {
    return new Map(Object.entries(__PRIVATE_selectablesToObject(e)));
}

function __PRIVATE_selectablesToObject(e) {
    const t = {};
    for (const n of e) {
        let e, r;
        if ("string" == typeof n ? (e = n, r = field(n)) : n instanceof Field || n instanceof AliasedExpression ? (e = n.alias, 
        r = n.expr) : fail(21273, {
            selectable: n
        }), void 0 !== t[e]) throw new FirestoreError("invalid-argument", `Duplicate alias or field '${e}'`);
        t[e] = r;
    }
    return t;
}

/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 * If the input is a string, it is assumed to be a field name, and a
 * field(value) is returned.
 *
 * @private
 * @internal
 * @param value
 */
function __PRIVATE_fieldOrExpression(e) {
    if (__PRIVATE_isString(e)) {
        return field(e);
    }
    /**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */
    return function __PRIVATE_valueToDefaultExpr(e) {
        let t;
        if (__PRIVATE_isFirestoreValue(e)) return constant(e);
        if (e instanceof Expression) return e;
        t = __PRIVATE_isPlainObject(e) ? map(e) : e instanceof Array ? array(e) : 
        /**
 * Checks if a value is a Pipeline object.
 *
 * We use duck typing here to avoid a circular dependency between pipeline.ts and pipeline_util.ts.
 */
        function __PRIVATE_isPipeline$1(e) {
            return "object" == typeof e && null !== e && "function" == typeof e.toArrayExpression;
        }
        /**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ (e) ? function pipelineValue(e) {
            return new __PRIVATE_PipelineValueExpression(e);
        }(e) : __PRIVATE__constant(e, void 0);
        return t;
    }(e);
}

class Stage {
    constructor(e) {
        /**
         * Store _optionsProto parsed by _readUserData.
         * @private
         * @internal
         * @protected
         */
        this.optionsProto = void 0, ({rawOptions: this.rawOptions, ...this.knownOptions} = e);
    }
    _readUserData(e) {
        this.optionsProto = this._optionsUtil.getOptionsProto(e, this.knownOptions, this.rawOptions);
    }
    _toProto(e) {
        return {
            name: this._name,
            options: this.optionsProto
        };
    }
}

class __PRIVATE_AddFields extends Stage {
    get _name() {
        return "add_fields";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.fields = e;
    }
    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toMapValue(e, this.fields) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.fields, e);
    }
}

class __PRIVATE_RemoveFields extends Stage {
    get _name() {
        return "remove_fields";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.fields = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: this.fields.map((t => t._toProto(e)))
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.fields, e);
    }
}

/**
 * @public
 */ class __PRIVATE_Define extends Stage {
    get _name() {
        return "let";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.ie = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toMapValue(e, this.ie) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.ie, e);
    }
}

class __PRIVATE_Aggregate extends Stage {
    get _name() {
        return "aggregate";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t, n) {
        super(n), this.groups = e, this.accumulators = t;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toMapValue(e, this.accumulators), __PRIVATE_toMapValue(e, this.groups) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.groups, e), __PRIVATE_readUserDataHelper(this.accumulators, e);
    }
}

class __PRIVATE_Distinct extends Stage {
    get _name() {
        return "distinct";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.groups = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toMapValue(e, this.groups) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.groups, e);
    }
}

class __PRIVATE_CollectionSource extends Stage {
    get _name() {
        return "collection";
    }
    get _optionsUtil() {
        return new OptionsUtil({
            forceIndex: {
                serverName: "force_index"
            }
        });
    }
    constructor(e, t) {
        super(t), 
        // prepend slash to collection string
        this.oe = e.startsWith("/") ? e : "/" + e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ {
                referenceValue: this.oe
            } ]
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_CollectionGroupSource extends Stage {
    get _name() {
        return "collection_group";
    }
    get _optionsUtil() {
        return new OptionsUtil({
            forceIndex: {
                serverName: "force_index"
            }
        });
    }
    constructor(e, t) {
        super(t), this.collectionId = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ {
                referenceValue: ""
            }, {
                stringValue: this.collectionId
            } ]
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_SubcollectionSource extends Stage {
    get _name() {
        return "subcollection";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.path = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ {
                stringValue: this.path
            } ]
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_DatabaseSource extends Stage {
    get _name() {
        return "database";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e)
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_DocumentsSource extends Stage {
    get _name() {
        return "documents";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.ae = e.map((e => e.startsWith("/") ? e : "/" + e));
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: this.ae.map((e => ({
                referenceValue: e
            })))
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_Where extends Stage {
    get _name() {
        return "where";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.condition = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ this.condition._toProto(e) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.condition, e);
    }
}

class __PRIVATE_FindNearest extends Stage {
    get _name() {
        return "find_nearest";
    }
    get _optionsUtil() {
        return new OptionsUtil({
            limit: {
                serverName: "limit"
            },
            distanceField: {
                serverName: "distance_field"
            }
        });
    }
    constructor(e, t, n, r) {
        super(r), this.vectorValue = e, this.field = t, this.distanceMeasure = n;
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ this.field._toProto(e), this.vectorValue._toProto(e), __PRIVATE_toStringValue(this.distanceMeasure) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.vectorValue, e), __PRIVATE_readUserDataHelper(this.field, e);
    }
}

class __PRIVATE_Limit extends Stage {
    get _name() {
        return "limit";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        __PRIVATE_hardAssert(!isNaN(e) && e !== 1 / 0 && e !== -1 / 0, 34860), super(t), this.limit = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ toNumber(e, this.limit) ]
        };
    }
}

class __PRIVATE_Offset extends Stage {
    get _name() {
        return "offset";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.offset = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ toNumber(e, this.offset) ]
        };
    }
}

class __PRIVATE_Select extends Stage {
    get _name() {
        return "select";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.selections = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toMapValue(e, this.selections) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.selections, e);
    }
}

class __PRIVATE_Sort extends Stage {
    get _name() {
        return "sort";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.orderings = e;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: this.orderings.map((t => t._toProto(e)))
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.orderings, e);
    }
}

class __PRIVATE_Sample extends Stage {
    get _name() {
        return "sample";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t, n) {
        super(n), this.rate = e, this.mode = t;
    }
    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ toNumber(e, this.rate), __PRIVATE_toStringValue(this.mode) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e);
    }
}

class __PRIVATE_Union extends Stage {
    get _name() {
        return "union";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.other = e;
    }
    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ __PRIVATE_toPipelineValue(this.other._toProto(e)) ]
        };
    }
    _readUserData(e) {
        this.other._readUserData(e), super._readUserData(e);
    }
}

class __PRIVATE_Unnest extends Stage {
    get _name() {
        return "unnest";
    }
    get _optionsUtil() {
        return new OptionsUtil({
            indexField: {
                serverName: "index_field"
            }
        });
    }
    constructor(e, t, n) {
        super(n), this.alias = e, this.expr = t;
    }
    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ this.expr._toProto(e), field(this.alias)._toProto(e) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.expr, e);
    }
}

class __PRIVATE_Replace extends Stage {
    get _name() {
        return "replace_with";
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
    constructor(e, t) {
        super(t), this.map = e;
    }
    _toProto(e) {
        return {
            ...super._toProto(e),
            args: [ this.map._toProto(e), __PRIVATE_toStringValue(__PRIVATE_Replace.ue) ]
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.map, e);
    }
}

__PRIVATE_Replace.ue = "full_replace";

/**
 * @beta
 */
class __PRIVATE_Search extends Stage {
    constructor(e) {
        super(e), this._e = e;
    }
    get _name() {
        return "search";
    }
    get _optionsUtil() {
        return new OptionsUtil({
            query: {
                serverName: "query"
            },
            limit: {
                serverName: "limit"
            },
            le: {
                serverName: "retrieval_depth"
            },
            sort: {
                serverName: "sort"
            },
            addFields: {
                serverName: "add_fields"
            },
            select: {
                serverName: "select"
            },
            offset: {
                serverName: "offset"
            },
            ce: {
                serverName: "query_enhancement"
            },
            languageCode: {
                serverName: "language_code"
            }
        });
    }
    /**
     * @private
     * @internal
     */    _toProto(e) {
        return {
            ...super._toProto(e),
            args: []
        };
    }
    _readUserData(e) {
        __PRIVATE_readUserDataHelper(this._e.query, e), this._e.addFields && __PRIVATE_readUserDataHelper(this._e.addFields, e), 
        this._e.select && __PRIVATE_readUserDataHelper(this._e.select, e), this._e.sort && __PRIVATE_readUserDataHelper(this._e.sort, e), 
        super._readUserData(e);
    }
}

/**
 * @beta
 */ class __PRIVATE_RawStage extends Stage {
    /**
     * @private
     * @internal
     */
    constructor(e, t, n) {
        super({
            rawOptions: n
        }), this.name = e, this.params = t;
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            name: this.name,
            args: this.params.map((t => t._toProto(e))),
            options: this.optionsProto
        };
    }
    _readUserData(e) {
        super._readUserData(e), __PRIVATE_readUserDataHelper(this.params, e);
    }
    get _name() {
        return this.name;
    }
    get _optionsUtil() {
        return new OptionsUtil({});
    }
}

/**
 * Helper to read user data across a number of different formats.
 * @param name - Name of the calling function. Used for error messages when invalid user data is encountered.
 * @param expressionMap
 * @returns the expressionMap argument.
 * @private
 */ function __PRIVATE_readUserDataHelper(e, t) {
    return __PRIVATE_isUserData(e) ? e._readUserData(t) : Array.isArray(e) ? e.forEach((e => e._readUserData(t))) : e instanceof Map ? e.forEach((e => e._readUserData(t))) : Object.values(e).forEach((e => e._readUserData(t))), 
    e;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 *
 * The Pipeline class provides a flexible and expressive framework for building complex data
 * transformation and query pipelines for Firestore.
 *
 * A pipeline takes data sources, such as Firestore collections or collection groups, and applies
 * a series of stages that are chained together. Each stage takes the output from the previous stage
 * (or the data source) and produces an output for the next stage (or as the final output of the
 * pipeline).
 *
 * Expressions can be used within each stage to filter and transform data through the stage.
 *
 * NOTE: The chained stages do not prescribe exactly how Firestore will execute the pipeline.
 * Instead, Firestore only guarantees that the result is the same as if the chained stages were
 * executed in order.
 *
 * Usage Examples:
 *
 * @example
 * ```typescript
 * const db: Firestore; // Assumes a valid firestore instance.
 *
 * // Example 1: Select specific fields and rename 'rating' to 'bookRating'
 * const results1 = await execute(db.pipeline()
 *     .collection("books")
 *     .select("title", "author", field("rating").as("bookRating")));
 *
 * // Example 2: Filter documents where 'genre' is "Science Fiction" and 'published' is after 1950
 * const results2 = await execute(db.pipeline()
 *     .collection("books")
 *     .where(and(field("genre").equal("Science Fiction"), field("published").greaterThan(1950))));
 *
 * // Example 3: Calculate the average rating of books published after 1980
 * const results3 = await execute(db.pipeline()
 *     .collection("books")
 *     .where(field("published").greaterThan(1980))
 *     .aggregate(average(field("rating")).as("averageRating")));
 * ```
 */ class Pipeline {
    /**
     * @internal
     * @private
     * @param _db
     * @param stages
     */
    constructor(
    /**
     * @internal
     * @private
     */
    e, 
    /**
     * @internal
     * @private
     */
    t) {
        this._db = e, this.stages = t;
    }
    _readUserData(e) {
        this.stages.forEach((t => {
            const n = e.ne({
                methodName: t._name
            });
            t._readUserData(n);
        }));
    }
    addFields(e, ...t) {
        // Process argument union(s) from method overloads
        let n, r;
        __PRIVATE_isSelectable(e) ? (n = [ e, ...t ], r = {}) : ({fields: n, ...r} = e);
        // Convert user land convenience types to internal types
                const s = __PRIVATE_selectablesToMap(n), i = new __PRIVATE_AddFields(s, r);
        // Create stage object
                // Add stage to the pipeline
        return this._addStage(i);
    }
    removeFields(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isField(e) || __PRIVATE_isString(e) ? {} : e, r = (__PRIVATE_isField(e) || __PRIVATE_isString(e) ? [ e, ...t ] : e.fields).map((e => __PRIVATE_isString(e) ? field(e) : e)), s = new __PRIVATE_RemoveFields(r, n);
        // Add stage to the pipeline
        return this._addStage(s);
    }
    define(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isAliasedExpr(e) ? {} : e, r = __PRIVATE_selectablesToMap(__PRIVATE_isAliasedExpr(e) ? [ e, ...t ] : e.variables), s = new __PRIVATE_Define(r, n);
        return this._addStage(s);
    }
    /**
     * @public
     * Converts this Pipeline into an expression that evaluates to an array of results.
     *
     * <p>Result Unwrapping:</p>
     * <ul>
     *  <li>If the items have a single field, their values are unwrapped and returned directly in the array.</li>
     *  <li>If the items have multiple fields, they are returned as objects in the array</li>
     * </ul>
     *
     * @example
     * ```typescript
     * // Get a list of reviewers for each book
     * db.pipeline().collection("books")
     *     .define(field("id").as("book_id"))
     *     .addFields(
     *         db.pipeline().collection("reviews")
     *             .where(field("book_id").equal(variable("book_id")))
     *             .select(field("reviewer"))
     *             .toArrayExpression()
     *             .as("reviewers")
     *     )
     * ```
     *
     * Output:
     * ```json
     * [
     *   {
     *     "id": "1",
     *     "title": "1984",
     *     "reviewers": ["Alice", "Bob"]
     *   }
     * ]
     * ```
     *
     * Multiple Fields:
     * ```typescript
     * // Get a list of reviews (reviewer and rating) for each book
     * db.pipeline().collection("books")
     *     .define(field("id").as("book_id"))
     *     .addFields(
     *         db.pipeline().collection("reviews")
     *             .where(field("book_id").equal(variable("book_id")))
     *             .select(field("reviewer"), field("rating"))
     *             .toArrayExpression()
     *             .as("reviews"))
     * ```
     *
     * Output:
     * ```json
     * [
     *   {
     *     "id": "1",
     *     "title": "1984",
     *     "reviews": [
     *       { "reviewer": "Alice", "rating": 5 },
     *       { "reviewer": "Bob", "rating": 4 }
     *     ]
     *   }
     * ]
     * ```
     *
     * @returns An `Expression` representing the execution of this pipeline.
     */    toArrayExpression() {
        return new FunctionExpression("array", [ __PRIVATE_fieldOrExpression(this) ]);
    }
    /**
     * @public
     * Converts this Pipeline into an expression that evaluates to a single scalar result.
     *
     * <p><b>Runtime Validation:</b> The runtime validates that the result set contains zero or one item. If
     * zero items, it evaluates to `null`.</p>
     *
     * <p>Result Unwrapping:</p>
     * <ul>
     *  <li>If the item has a single field, its value is unwrapped and returned directly.</li>
     *  <li>f the item has multiple fields, they are returned as an object.</li>
     * </ul>
     *
     * @example
     * ```typescript
     * // Calculate average rating for a restaurant
     * db.pipeline().collection("restaurants").addFields(
     *   db.pipeline().collection("reviews")
     *     .where(field("restaurant_id").equal(variable("rid")))
     *     .aggregate(average("rating").as("avg"))
     *     // Unwraps the single "avg" field to a scalar double
     *     .toScalarExpression().as("average_rating")
     * )
     * ```
     *
     * Output:
     * ```json
     * {
     *   "name": "The Burger Joint",
     *   "average_rating": 4.5
     * }
     * ```
     *
     * Multiple Fields:
     * ```typescript
     * // Calculate average rating AND count for a restaurant
     * db.pipeline().collection("restaurants").addFields(
     *   db.pipeline().collection("reviews")
     *     .where(field("restaurant_id").equal(variable("rid")))
     *     .aggregate(
     *       average("rating").as("avg"),
     *       count().as("count")
     *     )
     *     // Returns an object with "avg" and "count" fields
     *     .toScalarExpression().as("stats")
     * )
     * ```
     *
     * Output:
     * ```json
     * {
     *   "name": "The Burger Joint",
     *   "stats": {
     *     "avg": 4.5,
     *     "count": 100
     *   }
     * }
     * ```
     *
     * @returns An `Expression` representing the execution of this pipeline.
     */    toScalarExpression() {
        return new FunctionExpression("scalar", [ __PRIVATE_fieldOrExpression(this) ]);
    }
    select(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isSelectable(e) || __PRIVATE_isString(e) ? {} : e, r = __PRIVATE_selectablesToMap(__PRIVATE_isSelectable(e) || __PRIVATE_isString(e) ? [ e, ...t ] : e.selections), s = new __PRIVATE_Select(r, n);
        // Add stage to the pipeline
        return this._addStage(s);
    }
    where(e) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isBooleanExpr(e) ? {} : e, n = __PRIVATE_isBooleanExpr(e) ? e : e.condition, r = new __PRIVATE_Where(n, t);
        // Add stage to the pipeline
        return this._addStage(r);
    }
    offset(e) {
        // Process argument union(s) from method overloads
        let t, n;
        __PRIVATE_isNumber(e) ? (t = {}, n = e) : (t = e, n = e.offset);
        // Create stage object
                const r = new __PRIVATE_Offset(n, t);
        // Add stage to the pipeline
                return this._addStage(r);
    }
    limit(e) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isNumber(e) ? {} : e, n = __PRIVATE_isNumber(e) ? e : e.limit, r = new __PRIVATE_Limit(n, t);
        // Add stage to the pipeline
        return this._addStage(r);
    }
    distinct(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isString(e) || __PRIVATE_isSelectable(e) ? {} : e, r = __PRIVATE_selectablesToMap(__PRIVATE_isString(e) || __PRIVATE_isSelectable(e) ? [ e, ...t ] : e.groups), s = new __PRIVATE_Distinct(r, n);
        // Add stage to the pipeline
        return this._addStage(s);
    }
    aggregate(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isAliasedAggregate(e) ? {} : e, r = __PRIVATE_isAliasedAggregate(e) ? [ e, ...t ] : e.accumulators, s = __PRIVATE_isAliasedAggregate(e) ? [] : e.groups ?? [], i = function __PRIVATE_aliasedAggregateToMap(e) {
            return e.reduce(((e, t) => {
                if (void 0 !== e.get(t.alias)) throw new FirestoreError("invalid-argument", `Duplicate alias or field '${t.alias}'`);
                return e.set(t.alias, t.aggregate), e;
            }), new Map);
        }
        /**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */ (r), o = __PRIVATE_selectablesToMap(s), a = new __PRIVATE_Aggregate(o, i, n);
        // Add stage to the pipeline
        return this._addStage(a);
    }
    /**
     * Performs a vector proximity search on the documents from the previous stage, returning the
     * K-nearest documents based on the specified query `vectorValue` and `distanceMeasure`. The
     * returned documents will be sorted in order from nearest to furthest from the query `vectorValue`.
     *
     * <p>Example:
     *
     * ```typescript
     * // Find the 10 most similar books based on the book description.
     * const bookDescription = "Lorem ipsum...";
     * const queryVector: number[] = ...; // compute embedding of `bookDescription`
     *
     * firestore.pipeline().collection("books")
     *     .findNearest({
     *       field: 'embedding',
     *       vectorValue: queryVector,
     *       distanceMeasure: 'euclidean',
     *       limit: 10,                        // optional
     *       distanceField: 'computedDistance' // optional
     *     });
     * ```
     *
     * @param options - An object that specifies required and optional parameters for the stage.
     * @returns A new {@link @firebase/firestore/pipelines#Pipeline} object with this stage appended to the stage list.
     */    findNearest(e) {
        // Convert user land convenience types to internal types
        const t = __PRIVATE_toField(e.field), n = function __PRIVATE_vectorToExpr(e) {
            if (e instanceof Expression) return e;
            if (e instanceof VectorValue) return constant(e);
            if (Array.isArray(e)) return constant(vector(e));
            throw new Error("Unsupported value: " + typeof e);
        }(e.vectorValue), r = {
            distanceField: e.distanceField ? __PRIVATE_toField(e.distanceField) : void 0,
            limit: e.limit,
            rawOptions: e.rawOptions
        }, s = new __PRIVATE_FindNearest(n, t, e.distanceMeasure, r);
        // Add stage to the pipeline
        return this._addStage(s);
    }
    // TODO(search) link to external documentation citing list of supported
    // expressions, when that documentation is created. List is not maintained
    // in the SDK because the list will change as the backend enables support.
    /**
     * @beta
     * Add a search stage to the Pipeline. The search stage supports
     * full-text search and geo search expressions.
     *
     * @remarks This must be the first stage of the pipeline.
     * @remarks A limited set of expressions are supported in the search stage.
     *
     * @example
     * ```typescript
     * // Full-text search example
     * firestore.pipeline().collection("restaurants")
     * .search({
     *   query: documentMatches("waffles OR pancakes"),
     *   sort: [
     *     score().descending(),
     *   ],
     *   addFields: [
     *     score().as("searchScore"),
     *   ]
     * })
     * ```
     *
     * @example
     * ```typescript
     * // Geo distance search example
     * const queryLocation = new GeoPoint(0, 0);
     * db.pipeline().collection('restaurants').search({
     *   query: field('location').geoDistance(queryLocation).lessThanOrEqual(1000),
     *   sort: [
     *     score().descending(),
     *   ],
     * })
     * ```
     *
     * @param options - An object that specifies parameters for the stage.
     * @return A new `Pipeline` object with this stage appended to the stage list.
     */
    search(e) {
        // Convert user land convenience types to internal types
        const t = e.addFields ? __PRIVATE_selectablesToObject(e.addFields) : void 0, n = __PRIVATE_isExpr(e.query) ? e.query : documentMatches(e.query), r = __PRIVATE_isOrdering(e.sort) ? [ e.sort ] : e.sort, s = {
            ...e,
            addFields: t,
            select: undefined,
            query: n,
            sort: r
        }, i = new __PRIVATE_Search(s);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    sort(e, ...t) {
        // Process argument union(s) from method overloads
        const n = __PRIVATE_isOrdering(e) ? {} : e, r = __PRIVATE_isOrdering(e) ? [ e, ...t ] : e.orderings, s = new __PRIVATE_Sort(r, n);
        // Add stage to the pipeline
        return this._addStage(s);
    }
    replaceWith(e) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isString(e) || __PRIVATE_isExpr(e) ? {} : e, n = __PRIVATE_fieldOrExpression(__PRIVATE_isString(e) || __PRIVATE_isExpr(e) ? e : e.map), r = new __PRIVATE_Replace(n, t);
        // Add stage to the pipeline
        return this._addStage(r);
    }
    sample(e) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isNumber(e) ? {} : e;
        let n, r;
        __PRIVATE_isNumber(e) ? (n = e, r = "documents") : __PRIVATE_isNumber(e.documents) ? (n = e.documents, r = "documents") : (n = e.percentage, 
        r = "percent");
        // Create stage object
                const s = new __PRIVATE_Sample(n, r, t);
        // Add stage to the pipeline
                return this._addStage(s);
    }
    union(e) {
        // Process argument union(s) from method overloads
        let t, n;
        !function __PRIVATE_isPipeline(e) {
            return e instanceof Pipeline;
        }
        /**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
        /**
 * Provides the entry point for defining the data source of a Firestore {@link @firebase/firestore/pipelines#Pipeline}.
 *
 * Use the methods of this class (e.g., {@link @firebase/firestore/pipelines#PipelineSource.(collection:1)}, {@link @firebase/firestore/pipelines#PipelineSource.(collectionGroup:1)},
 * {@link @firebase/firestore/pipelines#PipelineSource.(database:1)}, or {@link @firebase/firestore/pipelines#PipelineSource.(documents:1)}) to specify the initial data
 * for your pipeline, such as a collection, a collection group, the entire database, or a set of specific documents.
 */ (e) ? ({other: n, ...t} = e) : (t = {}, n = e);
        // Create stage object
                const r = new __PRIVATE_Union(n, t);
        // Add stage to the pipeline
                return this._addStage(r);
    }
    unnest(e, t) {
        // Process argument union(s) from method overloads
        let n, r, s;
        __PRIVATE_isSelectable(e) ? (n = {}, r = e, s = t) : ({selectable: r, indexField: s, ...n} = e);
        // Convert user land convenience types to internal types
                const i = r.alias, o = r.expr;
        __PRIVATE_isString(s) && (n.indexField = _field(s, "unnest"));
        // Create stage object
                const a = new __PRIVATE_Unnest(i, o, n);
        // Add stage to the pipeline
                return this._addStage(a);
    }
    /**
     * Adds a raw stage to the pipeline.
     *
     * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
     * stages. Each raw stage is defined by a unique `name` and a set of `params` that control its
     * behavior.
     *
     * <p>Example (Assuming there is no 'where' stage available in SDK):
     *
     * @example
     * ```typescript
     * // Assume we don't have a built-in 'where' stage
     * firestore.pipeline().collection('books')
     *     .rawStage('where', [field('published').lessThan(1900)]) // Custom 'where' stage
     *     .select('title', 'author');
     * ```
     *
     * @param name - The unique name of the raw stage to add.
     * @param params - A list of parameters to configure the raw stage's behavior.
     * @param options - An object of key value pairs that specifies optional parameters for the stage.
     * @returns A new {@link @firebase/firestore/pipelines#Pipeline} object with this stage appended to the stage list.
     */    rawStage(e, t, r) {
        // Convert user land convenience types to internal types
        const s = t.map((e => e instanceof Expression || e instanceof AggregateFunction ? e : __PRIVATE_isPlainObject(e) ? function __PRIVATE__mapValue(e) {
            const t = new Map;
            for (const n in e) if (Object.prototype.hasOwnProperty.call(e, n)) {
                const r = e[n];
                t.set(n, __PRIVATE_valueToDefaultExpr$1(r));
            }
            return new MapValue(t, void 0);
        }(e) : __PRIVATE__constant(e, "rawStage"))), i = new __PRIVATE_RawStage(e, s, r ?? {});
        // Create stage object
                // Add stage to the pipeline
        return this._addStage(i);
    }
    /**
     * @internal
     * @private
     */    _toProto(e) {
        return {
            stages: this.stages.map((t => t._toProto(e)))
        };
    }
    _addStage(e) {
        const t = this.stages.map((e => e));
        return t.push(e), this.newPipeline(this._db, t);
    }
    /**
     * @internal
     * @private
     * @param db
     * @param userDataReader
     * @param userDataWriter
     * @param stages
     * @protected
     */    newPipeline(e, t) {
        return new Pipeline(e, t);
    }
}

class PipelineSource {
    /**
     * @internal
     * @private
     * @param databaseId
     * @param _createPipeline
     */
    constructor(e, 
    /**
     * @internal
     * @private
     */
    t) {
        this.databaseId = e, this._createPipeline = t;
    }
    collection(e) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isString(e) || __PRIVATE_isCollectionReference(e) ? {} : e, n = __PRIVATE_isString(e) || __PRIVATE_isCollectionReference(e) ? e : e.collection;
        // Validate that a user provided reference is for the same Firestore DB
        __PRIVATE_isCollectionReference(n) && this._validateReference(n);
        // Convert user land convenience types to internal types
                const r = __PRIVATE_isString(n) ? n : n.path, s = new __PRIVATE_CollectionSource(r, t);
        // Create stage object
                // Add stage to the pipeline
        return this._createPipeline([ s ]);
    }
    collectionGroup(e) {
        // Process argument union(s) from method overloads
        let t, n;
        __PRIVATE_isString(e) ? (t = e, n = {}) : ({collectionId: t, ...n} = e);
        // Create stage object
                const r = new __PRIVATE_CollectionGroupSource(t, n);
        // Add stage to the pipeline
                return this._createPipeline([ r ]);
    }
    database(e) {
        // Create stage object
        const t = new __PRIVATE_DatabaseSource(
        // Process argument union(s) from method overloads
        e = e ?? {});
        // Add stage to the pipeline
                return this._createPipeline([ t ]);
    }
    documents(e) {
        // Process argument union(s) from method overloads
        let t, n;
        Array.isArray(e) ? (n = e, t = {}) : ({docs: n, ...t} = e), 
        // Validate that all user provided references are for the same Firestore DB
        n.filter((e => e instanceof DocumentReference)).forEach((e => this._validateReference(e)));
        // Convert user land convenience types to internal types
        const r = n.map((e => __PRIVATE_isString(e) ? e : e.path)), s = new __PRIVATE_DocumentsSource(r, t);
        // Create stage object
                // Add stage to the pipeline
        return this._createPipeline([ s ]);
    }
    /**
     * Convert the given Query into an equivalent Pipeline.
     *
     * @param query - A Query to be converted into a Pipeline.
     *
     * @throws `FirestoreError` Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
     */    createFrom(e) {
        return __PRIVATE_toPipeline(e._query, e.firestore);
    }
    _validateReference(e) {
        const t = e.firestore._databaseId;
        if (!t.isEqual(this.databaseId)) throw new FirestoreError(E.INVALID_ARGUMENT, `Invalid ${e instanceof CollectionReference ? "CollectionReference" : "DocumentReference"}. The project ID ("${t.projectId}") or the database ("${t.database}") does not match the project ID ("${this.databaseId.projectId}") and database ("${this.databaseId.database}") of the target database of this Pipeline.`);
    }
}

function subcollection(e) {
    // Process argument union(s) from method overloads
    let t, n;
    __PRIVATE_isString(e) ? (t = e, n = {}) : ({path: t, ...n} = e);
    // Create stage object
        const r = new __PRIVATE_SubcollectionSource(t, n);
    return new Pipeline(void 0, [ r ]);
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Represents the results of a Firestore pipeline execution.
 *
 * A `PipelineSnapshot` contains zero or more {@link @firebase/firestore/pipelines#PipelineResult} objects
 * representing the documents returned by a pipeline query. It provides methods
 * to iterate over the documents and access metadata about the query results.
 *
 * @example
 * ```typescript
 * const snapshot: PipelineSnapshot = await firestore
 *   .pipeline()
 *   .collection('myCollection')
 *   .where(field('value').greaterThan(10))
 *   .execute();
 *
 * snapshot.results.forEach(doc => {
 *   console.log(doc.id, '=>', doc.data());
 * });
 * ```
 */ class PipelineSnapshot {
    constructor(e, t, n) {
        this._pipeline = e, this._executionTime = n, this._results = t;
    }
    /**
     * An array of all the results in the `PipelineSnapshot`.
     */    get results() {
        return this._results;
    }
    /**
     * The time at which the pipeline producing this result is executed.
     *
     * @readonly
     *
     */    get executionTime() {
        if (void 0 === this._executionTime) throw new Error("'executionTime' is expected to exist, but it is undefined");
        return this._executionTime;
    }
}

/**
 *
 * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
 * {@link @firebase/firestore/pipelines#PipelineResult.data} or {@link @firebase/firestore/pipelines#PipelineResult.(get:1)} methods.
 *
 * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
 * value.
 */ class PipelineResult {
    /**
     * @private
     * @internal
     *
     * @param userDataWriter - The serializer used to encode/decode protobuf.
     * @param ref - The reference to the document.
     * @param fields - The fields of the Firestore `Document` Protobuf backing
     * this document.
     * @param createTime - The time when the document was created if the result is a document, undefined otherwise.
     * @param updateTime - The time when the document was last updated if the result is a document, undefined otherwise.
     */
    constructor(e, t, n, r, s) {
        this._ref = n, this._userDataWriter = e, this._createTime = r, this._updateTime = s, 
        this._fields = t;
    }
    /**
     * The reference of the document, if it is a document; otherwise `undefined`.
     */    get ref() {
        return this._ref;
    }
    /**
     * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
     *
     * @readonly
     *
     */    get id() {
        return this._ref?.id;
    }
    /**
     * The time the document was created. Undefined if this result is not a document.
     *
     * @readonly
     */    get createTime() {
        return this._createTime;
    }
    /**
     * The time the document was last updated (at the time the snapshot was
     * generated). Undefined if this result is not a document.
     *
     * @readonly
     */    get updateTime() {
        return this._updateTime;
    }
    /**
     * Retrieves all fields in the result as an object.
     *
     * @returns An object containing all fields in the document or
     * 'undefined' if the document doesn't exist.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let data = results[0].data();
     *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
     * });
     * ```
     */    data() {
        return this._userDataWriter.convertValue(this._fields.value);
    }
    /**
     * @internal
     * @private
     *
     * Retrieves all fields in the result as a proto value.
     *
     * @returns An `Object` containing all fields in the result.
     */    _fieldsProto() {
        // Return a cloned value to prevent manipulation of the Snapshot's data
        return this._fields.clone().value.mapValue.fields;
    }
    /**
     * Retrieves the field specified by `field`.
     *
     * @param field - The field path
     * (e.g. 'foo' or 'foo.bar') to a specific field.
     * @returns The data at the specified field location or `undefined` if no
     * such field exists.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let field = results[0].get('a.b');
     *   console.log(`Retrieved field value: ${field}`);
     * });
     * ```
     */
    // We deliberately use `any` in the external API to not impose type-checking
    // on end users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(e) {
        if (void 0 === this._fields) return;
        __PRIVATE_isField(e) && (e = e.fieldName);
        const t = this._fields.field(__PRIVATE_fieldPathFromArgument("DocumentSnapshot.get", e));
        return null !== t ? this._userDataWriter.convertValue(t) : void 0;
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Executes this pipeline and returns a Promise to represent the asynchronous operation.
 *
 * The returned Promise can be used to track the progress of the pipeline execution
 * and retrieve the results (or handle any errors) asynchronously.
 *
 * The pipeline results are returned as a {@link @firebase/firestore/pipelines#PipelineSnapshot} that contains
 * a list of {@link @firebase/firestore/pipelines#PipelineResult} objects. Each {@link @firebase/firestore/pipelines#PipelineResult} typically
 * represents a single key/value map that has passed through all the
 * stages of the pipeline, however this might differ depending on the stages involved in the
 * pipeline. For example:
 *
 * <ul>
 *   <li>If there are no stages or only transformation stages, each {@link @firebase/firestore/pipelines#PipelineResult}
 *       represents a single document.</li>
 *   <li>If there is an aggregation, only a single {@link @firebase/firestore/pipelines#PipelineResult} is returned,
 *       representing the aggregated results over the entire dataset .</li>
 *   <li>If there is an aggregation stage with grouping, each {@link @firebase/firestore/pipelines#PipelineResult} represents a
 *       distinct group and its associated aggregated values.</li>
 * </ul>
 *
 * @example
 * ```typescript
 * const snapshot: PipelineSnapshot = await execute(firestore.pipeline().collection("books")
 *     .where(gt(field("rating"), 4.5))
 *     .select("title", "author", "rating"));
 *
 * const results: PipelineResults = snapshot.results;
 * ```
 *
 * @param pipeline - The pipeline to execute.
 * @returns A Promise representing the asynchronous pipeline execution.
 */ function execute(e) {
    if (!e._db) return Promise.reject(new FirestoreError(E.FAILED_PRECONDITION, "This pipeline was created without a database (e.g., as a subcollection pipeline) and cannot be executed directly. It can only be used as part of another pipeline."));
    const t = __PRIVATE_getDatastore(e._db), n = __PRIVATE_cast(e._db, Firestore), r = __PRIVATE_newUserDataReader(n).Ee(3 /* UserDataSource.Argument */ , "execute");
    e._readUserData(r);
    const s = new __PRIVATE_LiteUserDataWriter(n), i = new __PRIVATE_StructuredPipelineOptions({}, {});
    i._readUserData(r);
    const o = new StructuredPipeline(e, i);
    return __PRIVATE_invokeExecutePipeline(t, o).then((t => {
        // Get the execution time from the first result.
        // firestoreClientExecutePipeline returns at least one PipelineStreamElement
        // even if the returned document set is empty.
        const r = t.length > 0 ? t[0].executionTime?.toTimestamp() : void 0, i = t.filter((e => !!e.fields)).map((e => new PipelineResult(s, e.fields, e.key?.path ? new DocumentReference(n, null, e.key) : void 0, e.createTime?.toTimestamp(), e.updateTime?.toTimestamp())));
        return new PipelineSnapshot(e, i, r);
    }));
}

/**
 * Creates and returns a new PipelineSource, which allows specifying the source stage of a {@link @firebase/firestore/pipelines#Pipeline}.
 *
 * @example
 * ```
 * let myPipeline: Pipeline = firestore.pipeline().collection('books');
 * ```
 */ Firestore.prototype.pipeline = function() {
    return new PipelineSource(this._databaseId, (e => new Pipeline(this, e)));
};

export { AggregateFunction, AliasedAggregate, AliasedExpression, BooleanExpression, Constant, Expression, Field, FunctionExpression, Ordering, Pipeline, PipelineResult, PipelineSnapshot, PipelineSource, abs, add, and, array, arrayAgg, arrayAggDistinct, arrayConcat, arrayContains, arrayContainsAll, arrayContainsAny, arrayFilter, arrayFirst, arrayFirstN, arrayGet, arrayIndexOf, arrayIndexOfAll, arrayLast, arrayLastIndexOf, arrayLastN, arrayLength, arrayMaximum, arrayMaximumN, arrayMinimum, arrayMinimumN, arraySlice, arraySum, arrayTransform, arrayTransformWithIndex, ascending, average, byteLength, ceil, charLength, coalesce, collectionId, concat, conditional, constant, cosineDistance, count, countAll, countDistinct, countIf, currentDocument, currentTimestamp, descending, divide, documentId, documentMatches, dotProduct, endsWith, equal, equalAny, euclideanDistance, execute, exists, exp, field, first, floor, geoDistance, greaterThan, greaterThanOrEqual, ifAbsent, ifError, ifNull, isAbsent, isError, isType, join, last, length, lessThan, lessThanOrEqual, like, ln, log, log10, logicalMaximum, logicalMinimum, ltrim, map, mapEntries, mapGet, mapKeys, mapMerge, mapRemove, mapSet, mapValues, maximum, minimum, mod, multiply, nor, not, notEqual, notEqualAny, or, parent, pow, rand, regexContains, regexFind, regexFindAll, regexMatch, reverse, round, rtrim, score, split, sqrt, startsWith, stringConcat, stringContains, stringIndexOf, stringRepeat, stringReplaceAll, stringReplaceOne, stringReverse, subcollection, substring, subtract, sum, switchOn, timestampAdd, timestampDiff, timestampExtract, timestampSubtract, timestampToUnixMicros, timestampToUnixMillis, timestampToUnixSeconds, timestampTruncate, toLower, toUpper, trim, trunc, type, unixMicrosToTimestamp, unixMillisToTimestamp, unixSecondsToTimestamp, variable, vectorLength, xor };
//# sourceMappingURL=pipelines.browser.esm.js.map
