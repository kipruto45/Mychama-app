'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonE4edcbc6_node = require('./common-6f198c29.node.cjs.js');
require('@firebase/app');
require('@firebase/util');
require('@firebase/webchannel-wrapper/bloom-blob');
require('@firebase/logger');
require('util');
require('crypto');
require('@grpc/grpc-js');
require('@grpc/proto-loader');

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
/* eslint @typescript-eslint/no-explicit-any: 0 */
function isITimestamp(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('seconds' in obj &&
        (obj.seconds === null ||
            typeof obj.seconds === 'number' ||
            typeof obj.seconds === 'string') &&
        'nanos' in obj &&
        (obj.nanos === null || typeof obj.nanos === 'number')) {
        return true;
    }
    return false;
}
function isILatLng(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('latitude' in obj &&
        (obj.latitude === null || typeof obj.latitude === 'number') &&
        'longitude' in obj &&
        (obj.longitude === null || typeof obj.longitude === 'number')) {
        return true;
    }
    return false;
}
function isIArrayValue(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('values' in obj && (obj.values === null || Array.isArray(obj.values))) {
        return true;
    }
    return false;
}
function isIMapValue(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('fields' in obj && (obj.fields === null || commonE4edcbc6_node.isPlainObject(obj.fields))) {
        return true;
    }
    return false;
}
function isIFunction(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('name' in obj &&
        (obj.name === null || typeof obj.name === 'string') &&
        'args' in obj &&
        (obj.args === null || Array.isArray(obj.args))) {
        return true;
    }
    return false;
}
function isIPipeline(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    if ('stages' in obj && (obj.stages === null || Array.isArray(obj.stages))) {
        return true;
    }
    return false;
}
function isFirestoreValue(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false; // Must be a non-null object
    }
    // Check optional properties and their types
    if (('nullValue' in obj &&
        (obj.nullValue === null || obj.nullValue === 'NULL_VALUE')) ||
        ('booleanValue' in obj &&
            (obj.booleanValue === null || typeof obj.booleanValue === 'boolean')) ||
        ('integerValue' in obj &&
            (obj.integerValue === null ||
                typeof obj.integerValue === 'number' ||
                typeof obj.integerValue === 'string')) ||
        ('doubleValue' in obj &&
            (obj.doubleValue === null || typeof obj.doubleValue === 'number')) ||
        ('timestampValue' in obj &&
            (obj.timestampValue === null || isITimestamp(obj.timestampValue))) ||
        ('stringValue' in obj &&
            (obj.stringValue === null || typeof obj.stringValue === 'string')) ||
        ('bytesValue' in obj &&
            (obj.bytesValue === null || obj.bytesValue instanceof Uint8Array)) ||
        ('referenceValue' in obj &&
            (obj.referenceValue === null ||
                typeof obj.referenceValue === 'string')) ||
        ('geoPointValue' in obj &&
            (obj.geoPointValue === null || isILatLng(obj.geoPointValue))) ||
        ('arrayValue' in obj &&
            (obj.arrayValue === null || isIArrayValue(obj.arrayValue))) ||
        ('mapValue' in obj &&
            (obj.mapValue === null || isIMapValue(obj.mapValue))) ||
        ('fieldReferenceValue' in obj &&
            (obj.fieldReferenceValue === null ||
                typeof obj.fieldReferenceValue === 'string')) ||
        ('functionValue' in obj &&
            (obj.functionValue === null || isIFunction(obj.functionValue))) ||
        ('pipelineValue' in obj &&
            (obj.pipelineValue === null || isIPipeline(obj.pipelineValue)))) {
        return true;
    }
    return false;
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
 */
function valueToDefaultExpr$1(value) {
    let result;
    if (value instanceof Expression) {
        return value;
    }
    else if (commonE4edcbc6_node.isPlainObject(value)) {
        result = _map(value);
    }
    else if (value instanceof Array) {
        result = array(value);
    }
    else {
        result = _constant(value, undefined);
    }
    return result;
}
/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */
function vectorToExpr$1(value) {
    if (value instanceof Expression) {
        return value;
    }
    else if (value instanceof commonE4edcbc6_node.VectorValue) {
        return constant(value);
    }
    else if (Array.isArray(value)) {
        return constant(commonE4edcbc6_node.vector(value));
    }
    else {
        throw new Error('Unsupported value: ' + typeof value);
    }
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
function fieldOrExpression$1(value) {
    if (commonE4edcbc6_node.isString(value)) {
        const result = field(value);
        return result;
    }
    else {
        return valueToDefaultExpr$1(value);
    }
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
 */
class Expression {
    constructor() {
        this._protoValueType = 'ProtoValue';
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
     */
    add(second) {
        return new FunctionExpression('add', [this, valueToDefaultExpr$1(second)], 'add');
    }
    /**
     * Wraps the expression in a [BooleanExpression].
     *
     * @returns A [BooleanExpression] representing the same expression.
     */
    asBoolean() {
        if (this instanceof BooleanExpression) {
            return this;
        }
        else if (this instanceof Constant) {
            return new BooleanConstant(this);
        }
        else if (this instanceof Field) {
            return new BooleanField(this);
        }
        else if (this instanceof FunctionExpression) {
            return new BooleanFunctionExpression(this);
        }
        else {
            throw new commonE4edcbc6_node.FirestoreError('invalid-argument', `Conversion of type ${typeof this} to BooleanExpression not supported.`);
        }
    }
    subtract(subtrahend) {
        return new FunctionExpression('subtract', [this, valueToDefaultExpr$1(subtrahend)], 'subtract');
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
     */
    multiply(second) {
        return new FunctionExpression('multiply', [this, valueToDefaultExpr$1(second)], 'multiply');
    }
    divide(divisor) {
        return new FunctionExpression('divide', [this, valueToDefaultExpr$1(divisor)], 'divide');
    }
    mod(other) {
        return new FunctionExpression('mod', [this, valueToDefaultExpr$1(other)], 'mod');
    }
    equal(other) {
        return new FunctionExpression('equal', [this, valueToDefaultExpr$1(other)], 'equal').asBoolean();
    }
    notEqual(other) {
        return new FunctionExpression('not_equal', [this, valueToDefaultExpr$1(other)], 'notEqual').asBoolean();
    }
    lessThan(other) {
        return new FunctionExpression('less_than', [this, valueToDefaultExpr$1(other)], 'lessThan').asBoolean();
    }
    lessThanOrEqual(other) {
        return new FunctionExpression('less_than_or_equal', [this, valueToDefaultExpr$1(other)], 'lessThanOrEqual').asBoolean();
    }
    greaterThan(other) {
        return new FunctionExpression('greater_than', [this, valueToDefaultExpr$1(other)], 'greaterThan').asBoolean();
    }
    greaterThanOrEqual(other) {
        return new FunctionExpression('greater_than_or_equal', [this, valueToDefaultExpr$1(other)], 'greaterThanOrEqual').asBoolean();
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
     */
    arrayConcat(secondArray, ...otherArrays) {
        const elements = [secondArray, ...otherArrays];
        const exprValues = elements.map(value => valueToDefaultExpr$1(value));
        return new FunctionExpression('array_concat', [this, ...exprValues], 'arrayConcat');
    }
    arrayContains(element) {
        return new FunctionExpression('array_contains', [this, valueToDefaultExpr$1(element)], 'arrayContains').asBoolean();
    }
    arrayContainsAll(values) {
        const normalizedExpr = Array.isArray(values)
            ? new ListOfExprs(values.map(valueToDefaultExpr$1), 'arrayContainsAll')
            : values;
        return new FunctionExpression('array_contains_all', [this, normalizedExpr], 'arrayContainsAll').asBoolean();
    }
    arrayContainsAny(values) {
        const normalizedExpr = Array.isArray(values)
            ? new ListOfExprs(values.map(valueToDefaultExpr$1), 'arrayContainsAny')
            : values;
        return new FunctionExpression('array_contains_any', [this, normalizedExpr], 'arrayContainsAny').asBoolean();
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
     */
    arrayReverse() {
        return new FunctionExpression('array_reverse', [this]);
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
     */
    arrayLength() {
        return new FunctionExpression('array_length', [this], 'arrayLength');
    }
    equalAny(others) {
        const exprOthers = Array.isArray(others)
            ? new ListOfExprs(others.map(valueToDefaultExpr$1), 'equalAny')
            : others;
        return new FunctionExpression('equal_any', [this, exprOthers], 'equalAny').asBoolean();
    }
    notEqualAny(others) {
        const exprOthers = Array.isArray(others)
            ? new ListOfExprs(others.map(valueToDefaultExpr$1), 'notEqualAny')
            : others;
        return new FunctionExpression('not_equal_any', [this, exprOthers], 'notEqualAny').asBoolean();
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
     */
    exists() {
        return new FunctionExpression('exists', [this], 'exists').asBoolean();
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
     */
    charLength() {
        return new FunctionExpression('char_length', [this], 'charLength');
    }
    like(stringOrExpr) {
        return new FunctionExpression('like', [this, valueToDefaultExpr$1(stringOrExpr)], 'like').asBoolean();
    }
    regexContains(stringOrExpr) {
        return new FunctionExpression('regex_contains', [this, valueToDefaultExpr$1(stringOrExpr)], 'regexContains').asBoolean();
    }
    regexFind(stringOrExpr) {
        return new FunctionExpression('regex_find', [this, valueToDefaultExpr$1(stringOrExpr)], 'regexFind');
    }
    regexFindAll(stringOrExpr) {
        return new FunctionExpression('regex_find_all', [this, valueToDefaultExpr$1(stringOrExpr)], 'regexFindAll');
    }
    regexMatch(stringOrExpr) {
        return new FunctionExpression('regex_match', [this, valueToDefaultExpr$1(stringOrExpr)], 'regexMatch').asBoolean();
    }
    stringContains(stringOrExpr) {
        return new FunctionExpression('string_contains', [this, valueToDefaultExpr$1(stringOrExpr)], 'stringContains').asBoolean();
    }
    startsWith(stringOrExpr) {
        return new FunctionExpression('starts_with', [this, valueToDefaultExpr$1(stringOrExpr)], 'startsWith').asBoolean();
    }
    endsWith(stringOrExpr) {
        return new FunctionExpression('ends_with', [this, valueToDefaultExpr$1(stringOrExpr)], 'endsWith').asBoolean();
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
     */
    toLower() {
        return new FunctionExpression('to_lower', [this], 'toLower');
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
     */
    toUpper() {
        return new FunctionExpression('to_upper', [this], 'toUpper');
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
     */
    trim(valueToTrim) {
        const args = [this];
        if (valueToTrim) {
            args.push(valueToDefaultExpr$1(valueToTrim));
        }
        return new FunctionExpression('trim', args, 'trim');
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
     */
    ltrim(valueToTrim) {
        const args = [this];
        if (valueToTrim) {
            args.push(valueToDefaultExpr$1(valueToTrim));
        }
        return new FunctionExpression('ltrim', args, 'ltrim');
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
     */
    rtrim(valueToTrim) {
        const args = [this];
        if (valueToTrim) {
            args.push(valueToDefaultExpr$1(valueToTrim));
        }
        return new FunctionExpression('rtrim', args, 'rtrim');
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
     */
    type() {
        return new FunctionExpression('type', [this]);
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
     */
    isType(type) {
        return new FunctionExpression('is_type', [this, constant(type)], 'isType').asBoolean();
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
     */
    stringConcat(secondString, ...otherStrings) {
        const elements = [secondString, ...otherStrings];
        const exprs = elements.map(valueToDefaultExpr$1);
        return new FunctionExpression('string_concat', [this, ...exprs], 'stringConcat');
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
     */
    stringIndexOf(search) {
        return new FunctionExpression('string_index_of', [this, valueToDefaultExpr$1(search)], 'stringIndexOf');
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
     */
    stringRepeat(repetitions) {
        return new FunctionExpression('string_repeat', [this, valueToDefaultExpr$1(repetitions)], 'stringRepeat');
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
     */
    stringReplaceAll(find, replacement) {
        return new FunctionExpression('string_replace_all', [this, valueToDefaultExpr$1(find), valueToDefaultExpr$1(replacement)], 'stringReplaceAll');
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
     */
    stringReplaceOne(find, replacement) {
        return new FunctionExpression('string_replace_one', [this, valueToDefaultExpr$1(find), valueToDefaultExpr$1(replacement)], 'stringReplaceOne');
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
     */
    concat(second, ...others) {
        const elements = [second, ...others];
        const exprs = elements.map(valueToDefaultExpr$1);
        return new FunctionExpression('concat', [this, ...exprs], 'concat');
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
     */
    reverse() {
        return new FunctionExpression('reverse', [this], 'reverse');
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
     */
    arrayFilter(alias, filter) {
        return new FunctionExpression('array_filter', [this, valueToDefaultExpr$1(alias), filter], 'arrayFilter');
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
     */
    arrayTransform(elementAlias, transform) {
        return new FunctionExpression('array_transform', [this, valueToDefaultExpr$1(elementAlias), transform], 'arrayTransform');
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
     */
    arrayTransformWithIndex(elementAlias, indexAlias, transform) {
        return new FunctionExpression('array_transform', [
            this,
            valueToDefaultExpr$1(elementAlias),
            valueToDefaultExpr$1(indexAlias),
            transform
        ], 'arrayTransformWithIndex');
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
     */
    arraySlice(offset, length) {
        const args = [this, valueToDefaultExpr$1(offset)];
        if (length !== undefined) {
            args.push(valueToDefaultExpr$1(length));
        }
        return new FunctionExpression('array_slice', args, 'arraySlice');
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
     */
    arrayFirst() {
        return new FunctionExpression('array_first', [this], 'arrayFirst');
    }
    arrayFirstN(n) {
        return new FunctionExpression('array_first_n', [this, valueToDefaultExpr$1(n)], 'arrayFirstN');
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
     */
    arrayLast() {
        return new FunctionExpression('array_last', [this], 'arrayLast');
    }
    arrayLastN(n) {
        return new FunctionExpression('array_last_n', [this, valueToDefaultExpr$1(n)], 'arrayLastN');
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
     */
    arrayMaximum() {
        return new FunctionExpression('maximum', [this], 'arrayMaximum');
    }
    arrayMaximumN(n) {
        return new FunctionExpression('maximum_n', [this, valueToDefaultExpr$1(n)], 'arrayMaximumN');
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
     */
    arrayMinimum() {
        return new FunctionExpression('minimum', [this], 'arrayMinimum');
    }
    arrayMinimumN(n) {
        return new FunctionExpression('minimum_n', [this, valueToDefaultExpr$1(n)], 'arrayMinimumN');
    }
    arrayIndexOf(search) {
        return new FunctionExpression('array_index_of', [this, valueToDefaultExpr$1(search), valueToDefaultExpr$1('first')], 'arrayIndexOf');
    }
    arrayLastIndexOf(search) {
        return new FunctionExpression('array_index_of', [this, valueToDefaultExpr$1(search), valueToDefaultExpr$1('last')], 'arrayLastIndexOf');
    }
    arrayIndexOfAll(search) {
        return new FunctionExpression('array_index_of_all', [this, valueToDefaultExpr$1(search)], 'arrayIndexOfAll');
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
     */
    byteLength() {
        return new FunctionExpression('byte_length', [this], 'byteLength');
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
     */
    ceil() {
        return new FunctionExpression('ceil', [this]);
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
     */
    floor() {
        return new FunctionExpression('floor', [this]);
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
     */
    abs() {
        return new FunctionExpression('abs', [this]);
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
     */
    exp() {
        return new FunctionExpression('exp', [this]);
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
     */
    mapGet(subfield) {
        return new FunctionExpression('map_get', [this, constant(subfield)], 'mapGet');
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
     */
    mapSet(key, value, ...moreKeyValues) {
        const args = [
            this,
            valueToDefaultExpr$1(key),
            valueToDefaultExpr$1(value),
            ...moreKeyValues.map(valueToDefaultExpr$1)
        ];
        return new FunctionExpression('map_set', args, 'mapSet');
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
     */
    mapKeys() {
        return new FunctionExpression('map_keys', [this], 'mapKeys');
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
     */
    mapValues() {
        return new FunctionExpression('map_values', [this], 'mapValues');
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
     */
    mapEntries() {
        return new FunctionExpression('map_entries', [this], 'mapEntries');
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
     */
    getField(key) {
        return new FunctionExpression('get_field', [this, valueToDefaultExpr$1(key)], 'get_field');
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
     */
    count() {
        return AggregateFunction._create('count', [this], 'count');
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
     */
    sum() {
        return AggregateFunction._create('sum', [this], 'sum');
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
     */
    average() {
        return AggregateFunction._create('average', [this], 'average');
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
     */
    minimum() {
        return AggregateFunction._create('minimum', [this], 'minimum');
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
     */
    maximum() {
        return AggregateFunction._create('maximum', [this], 'maximum');
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
     */
    first() {
        return AggregateFunction._create('first', [this], 'first');
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
     */
    last() {
        return AggregateFunction._create('last', [this], 'last');
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
     */
    arrayAgg() {
        return AggregateFunction._create('array_agg', [this], 'arrayAgg');
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
     */
    arrayAggDistinct() {
        return AggregateFunction._create('array_agg_distinct', [this], 'arrayAggDistinct');
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
     */
    countDistinct() {
        return AggregateFunction._create('count_distinct', [this], 'countDistinct');
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
     */
    logicalMaximum(second, ...others) {
        const values = [second, ...others];
        return new FunctionExpression('maximum', [this, ...values.map(valueToDefaultExpr$1)], 'logicalMaximum');
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
     */
    logicalMinimum(second, ...others) {
        const values = [second, ...others];
        return new FunctionExpression('minimum', [this, ...values.map(valueToDefaultExpr$1)], 'minimum');
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
     */
    vectorLength() {
        return new FunctionExpression('vector_length', [this], 'vectorLength');
    }
    cosineDistance(other) {
        return new FunctionExpression('cosine_distance', [this, vectorToExpr$1(other)], 'cosineDistance');
    }
    dotProduct(other) {
        return new FunctionExpression('dot_product', [this, vectorToExpr$1(other)], 'dotProduct');
    }
    euclideanDistance(other) {
        return new FunctionExpression('euclidean_distance', [this, vectorToExpr$1(other)], 'euclideanDistance');
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
     */
    unixMicrosToTimestamp() {
        return new FunctionExpression('unix_micros_to_timestamp', [this], 'unixMicrosToTimestamp');
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
     */
    timestampToUnixMicros() {
        return new FunctionExpression('timestamp_to_unix_micros', [this], 'timestampToUnixMicros');
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
     */
    unixMillisToTimestamp() {
        return new FunctionExpression('unix_millis_to_timestamp', [this], 'unixMillisToTimestamp');
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
     */
    timestampToUnixMillis() {
        return new FunctionExpression('timestamp_to_unix_millis', [this], 'timestampToUnixMillis');
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
     */
    unixSecondsToTimestamp() {
        return new FunctionExpression('unix_seconds_to_timestamp', [this], 'unixSecondsToTimestamp');
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
     */
    timestampToUnixSeconds() {
        return new FunctionExpression('timestamp_to_unix_seconds', [this], 'timestampToUnixSeconds');
    }
    timestampAdd(unit, amount) {
        return new FunctionExpression('timestamp_add', [this, valueToDefaultExpr$1(unit), valueToDefaultExpr$1(amount)], 'timestampAdd');
    }
    timestampSubtract(unit, amount) {
        return new FunctionExpression('timestamp_subtract', [this, valueToDefaultExpr$1(unit), valueToDefaultExpr$1(amount)], 'timestampSubtract');
    }
    timestampDiff(start, unit) {
        return new FunctionExpression('timestamp_diff', [this, fieldOrExpression$1(start), valueToDefaultExpr$1(unit)], 'timestampDiff');
    }
    timestampExtract(part, timezone) {
        const args = [this, valueToDefaultExpr$1(part)];
        if (timezone) {
            args.push(valueToDefaultExpr$1(timezone));
        }
        return new FunctionExpression('timestamp_extract', args, 'timestampExtract');
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
     */
    documentId() {
        return new FunctionExpression('document_id', [this], 'documentId');
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
     */
    parent() {
        return new FunctionExpression('parent', [this], 'parent');
    }
    substring(position, length) {
        const positionExpr = valueToDefaultExpr$1(position);
        if (length === undefined) {
            return new FunctionExpression('substring', [this, positionExpr], 'substring');
        }
        else {
            return new FunctionExpression('substring', [this, positionExpr, valueToDefaultExpr$1(length)], 'substring');
        }
    }
    arrayGet(offset) {
        return new FunctionExpression('array_get', [this, valueToDefaultExpr$1(offset)], 'arrayGet');
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
     */
    isError() {
        return new FunctionExpression('is_error', [this], 'isError').asBoolean();
    }
    ifError(catchValue) {
        const result = new FunctionExpression('if_error', [this, valueToDefaultExpr$1(catchValue)], 'ifError');
        return catchValue instanceof BooleanExpression
            ? result.asBoolean()
            : result;
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
     */
    isAbsent() {
        return new FunctionExpression('is_absent', [this], 'isAbsent').asBoolean();
    }
    mapRemove(stringExpr) {
        return new FunctionExpression('map_remove', [this, valueToDefaultExpr$1(stringExpr)], 'mapRemove');
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
     */
    mapMerge(secondMap, ...otherMaps) {
        const secondMapExpr = valueToDefaultExpr$1(secondMap);
        const otherMapExprs = otherMaps.map(valueToDefaultExpr$1);
        return new FunctionExpression('map_merge', [this, secondMapExpr, ...otherMapExprs], 'mapMerge');
    }
    pow(exponent) {
        return new FunctionExpression('pow', [this, valueToDefaultExpr$1(exponent)]);
    }
    trunc(decimalPlaces) {
        if (decimalPlaces === undefined) {
            return new FunctionExpression('trunc', [this]);
        }
        else {
            return new FunctionExpression('trunc', [this, valueToDefaultExpr$1(decimalPlaces)], 'trunc');
        }
    }
    round(decimalPlaces) {
        if (decimalPlaces === undefined) {
            return new FunctionExpression('round', [this]);
        }
        else {
            return new FunctionExpression('round', [this, valueToDefaultExpr$1(decimalPlaces)], 'round');
        }
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
     */
    collectionId() {
        return new FunctionExpression('collection_id', [this]);
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
     */
    length() {
        return new FunctionExpression('length', [this]);
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
     */
    ln() {
        return new FunctionExpression('ln', [this]);
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
     */
    sqrt() {
        return new FunctionExpression('sqrt', [this]);
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
     */
    stringReverse() {
        return new FunctionExpression('string_reverse', [this]);
    }
    ifAbsent(elseValueOrExpression) {
        return new FunctionExpression('if_absent', [this, valueToDefaultExpr$1(elseValueOrExpression)], 'ifAbsent');
    }
    ifNull(elseValueOrExpression) {
        return new FunctionExpression('if_null', [this, valueToDefaultExpr$1(elseValueOrExpression)], 'ifNull');
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
     */
    coalesce(replacement, ...others) {
        return new FunctionExpression('coalesce', [
            this,
            valueToDefaultExpr$1(replacement),
            ...others.map(valueToDefaultExpr$1)
        ], 'coalesce');
    }
    join(delimeterValueOrExpression) {
        return new FunctionExpression('join', [this, valueToDefaultExpr$1(delimeterValueOrExpression)], 'join');
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
     */
    log10() {
        return new FunctionExpression('log10', [this]);
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
     */
    arraySum() {
        return new FunctionExpression('sum', [this]);
    }
    split(delimiter) {
        return new FunctionExpression('split', [
            this,
            valueToDefaultExpr$1(delimiter)
        ]);
    }
    timestampTruncate(granularity, timezone) {
        const args = [this, valueToDefaultExpr$1(granularity)];
        if (timezone) {
            args.push(valueToDefaultExpr$1(timezone));
        }
        return new FunctionExpression('timestamp_trunc', args);
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
    //
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
    //
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
    //
    // /**
    //  * Evaluates to an HTML-formatted text snippet that renders terms matching
    //  * the search query in `<b>bold</b>`.
    //  *
    //  * @remarks This Expression can only be used within a `Search` stage.
    //  *
    //  * @param options Define how snippeting behaves.
    //  */
    // snippet(options: SnippetOptions): Expression;
    //
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
     */
    descending() {
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
     */
    as(name) {
        return new AliasedExpression(this, name, 'as');
    }
}
/**
 *
 * A class that represents an aggregate function.
 */
class AggregateFunction {
    constructor(name, params) {
        this.name = name;
        this.params = params;
        this.exprType = 'AggregateFunction';
        this._protoValueType = 'ProtoValue';
    }
    /**
     * @internal
     * @private
     */
    static _create(name, params, methodName) {
        const af = new AggregateFunction(name, params);
        af._methodName = methodName;
        return af;
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
     */
    as(name) {
        return new AliasedAggregate(this, name, 'as');
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            functionValue: {
                name: this.name,
                args: this.params.map(p => p._toProto(serializer))
            }
        };
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        context = this._methodName
            ? context.contextWith({ methodName: this._methodName })
            : context;
        this.params.forEach(expr => {
            return expr._readUserData(context);
        });
    }
}
/**
 *
 * An AggregateFunction with alias.
 */
class AliasedAggregate {
    constructor(aggregate, alias, _methodName) {
        this.aggregate = aggregate;
        this.alias = alias;
        this._methodName = _methodName;
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        this.aggregate._readUserData(context);
    }
}
class AliasedExpression {
    constructor(expr, alias, _methodName) {
        this.expr = expr;
        this.alias = alias;
        this._methodName = _methodName;
        this.exprType = 'AliasedExpression';
        this.selectable = true;
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        this.expr._readUserData(context);
    }
}
/**
 * @internal
 */
class ListOfExprs extends Expression {
    constructor(exprs, _methodName) {
        super();
        this.exprs = exprs;
        this._methodName = _methodName;
        this.expressionType = 'ListOfExpressions';
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            arrayValue: {
                values: this.exprs.map(p => p._toProto(serializer))
            }
        };
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        this.exprs.forEach((expr) => expr._readUserData(context));
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
 */
class Field extends Expression {
    /**
     * @internal
     * @private
     * @hideconstructor
     * @param fieldPath
     */
    constructor(fieldPath, _methodName) {
        super();
        this.fieldPath = fieldPath;
        this._methodName = _methodName;
        this.expressionType = 'Field';
        this.selectable = true;
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
    geoDistance(location) {
        return new FunctionExpression('geo_distance', [this, valueToDefaultExpr$1(location)], 'geoDistance');
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            fieldReferenceValue: this.fieldPath.canonicalString()
        };
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) { }
}
function field(nameOrPath) {
    return _field(nameOrPath, 'field');
}
function _field(nameOrPath, methodName) {
    if (typeof nameOrPath === 'string') {
        if (commonE4edcbc6_node.DOCUMENT_KEY_NAME === nameOrPath) {
            return new Field(commonE4edcbc6_node.documentId()._internalPath, methodName);
        }
        return new Field(commonE4edcbc6_node.fieldPathFromArgument('field', nameOrPath), methodName);
    }
    else {
        return new Field(nameOrPath._internalPath, methodName);
    }
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
 */
class Constant extends Expression {
    /**
     * @private
     * @internal
     * @hideconstructor
     * @param value - The value of the constant.
     */
    constructor(value, _methodName) {
        super();
        this.value = value;
        this._methodName = _methodName;
        this.expressionType = 'Constant';
    }
    /**
     * @private
     * @internal
     */
    static _fromProto(value) {
        const result = new Constant(value, undefined);
        result._protoValue = value;
        return result;
    }
    /**
     * @private
     * @internal
     */
    _toProto(_) {
        commonE4edcbc6_node.hardAssert(this._protoValue !== undefined, 0x00ed);
        return this._protoValue;
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        context = this._methodName
            ? context.contextWith({ methodName: this._methodName })
            : context;
        if (isFirestoreValue(this._protoValue)) {
            return;
        }
        else {
            this._protoValue = commonE4edcbc6_node.parseData(this.value, context);
        }
    }
}
function constant(value) {
    return _constant(value, 'constant');
}
/**
 * @internal
 * @private
 * @param value
 * @param methodName
 */
function _constant(value, methodName) {
    const c = new Constant(value, methodName);
    if (typeof value === 'boolean') {
        return new BooleanConstant(c);
    }
    else {
        return c;
    }
}
/**
 * Internal only
 * @internal
 * @private
 */
class MapValue extends Expression {
    constructor(plainObject, _methodName) {
        super();
        this.plainObject = plainObject;
        this._methodName = _methodName;
        this.expressionType = 'Constant';
    }
    _readUserData(context) {
        context = this._methodName
            ? context.contextWith({ methodName: this._methodName })
            : context;
        this.plainObject.forEach(expr => {
            expr._readUserData(context);
        });
    }
    _toProto(serializer) {
        return commonE4edcbc6_node.toMapValue(serializer, this.plainObject);
    }
}
/**
 *
 * This class defines the base class for Firestore {@link @firebase/firestore/pipelines#Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link @firebase/firestore/pipelines#and}, {@link @firebase/firestore/pipelines#(equal:1)},
 * or the methods on {@link @firebase/firestore/pipelines#Expression} ({@link @firebase/firestore/pipelines#Expression.(equal:1)}, {@link @firebase/firestore/pipelines#Expression.(lessThan:1)}, etc.) to construct new Function instances.
 */
class FunctionExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(name, params, methodName, options) {
        super();
        this.name = name;
        this.params = params;
        this.expressionType = 'Function';
        /**
         * @private
         * @internal
         */
        this._optionsProto = undefined;
        if (methodName !== undefined) {
            this._methodName = methodName;
        }
        if (options !== undefined) {
            this._options = options;
        }
    }
    /**
     * @private
     * @internal
     */
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        const returnValue = {
            functionValue: {
                name: this.name,
                args: this.params.map(p => p._toProto(serializer))
            }
        };
        if (this._optionsProto) {
            returnValue.functionValue.options = this._optionsProto;
        }
        return returnValue;
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        context = this._methodName
            ? context.contextWith({ methodName: this._methodName })
            : context;
        this.params.forEach(expr => {
            return expr._readUserData(context);
        });
        if (this._options) {
            this._optionsProto = this._optionsUtil.getOptionsProto(context, this._options);
        }
    }
}
/**
 *
 * An interface that represents a filter condition.
 */
class BooleanExpression extends Expression {
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
     */
    countIf() {
        return AggregateFunction._create('count_if', [this], 'countIf');
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
     */
    not() {
        return new FunctionExpression('not', [this], 'not').asBoolean();
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
     */
    conditional(thenExpr, elseExpr) {
        return new FunctionExpression('conditional', [this, thenExpr, elseExpr], 'conditional');
    }
    ifError(catchValue) {
        const normalizedCatchValue = valueToDefaultExpr$1(catchValue);
        const expr = new FunctionExpression('if_error', [this, normalizedCatchValue], 'ifError');
        return normalizedCatchValue instanceof BooleanExpression
            ? expr.asBoolean()
            : expr;
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return this._expr._toProto(serializer);
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        this._expr._readUserData(context);
    }
}
class BooleanFunctionExpression extends BooleanExpression {
    constructor(_expr) {
        super();
        this._expr = _expr;
        this.expressionType = 'Function';
    }
}
class BooleanConstant extends BooleanExpression {
    constructor(_expr) {
        super();
        this._expr = _expr;
        this.expressionType = 'Constant';
    }
}
class BooleanField extends BooleanExpression {
    constructor(_expr) {
        super();
        this._expr = _expr;
        this.expressionType = 'Field';
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
 */
function countIf(booleanExpr) {
    return booleanExpr.countIf();
}
function arrayGet(array, offset) {
    return fieldOrExpression$1(array).arrayGet(valueToDefaultExpr$1(offset));
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
 */
function isError(value) {
    return value.isError().asBoolean();
}
function ifError(tryExpr, catchValue) {
    if (tryExpr instanceof BooleanExpression &&
        catchValue instanceof BooleanExpression) {
        return tryExpr.ifError(catchValue).asBoolean();
    }
    else {
        return tryExpr.ifError(valueToDefaultExpr$1(catchValue));
    }
}
function isAbsent(value) {
    return fieldOrExpression$1(value).isAbsent();
}
function mapRemove(mapExpr, stringExpr) {
    return fieldOrExpression$1(mapExpr).mapRemove(valueToDefaultExpr$1(stringExpr));
}
function mapMerge(firstMap, secondMap, ...otherMaps) {
    const secondMapExpr = valueToDefaultExpr$1(secondMap);
    const otherMapExprs = otherMaps.map(valueToDefaultExpr$1);
    return fieldOrExpression$1(firstMap).mapMerge(secondMapExpr, ...otherMapExprs);
}
function documentId(documentPath) {
    // @ts-ignore
    const documentPathExpr = valueToDefaultExpr$1(documentPath);
    return documentPathExpr.documentId();
}
function parent(documentPath) {
    const documentPathExpr = valueToDefaultExpr$1(documentPath);
    return documentPathExpr.parent();
}
function substring(field, position, length) {
    const fieldExpr = fieldOrExpression$1(field);
    const positionExpr = valueToDefaultExpr$1(position);
    const lengthExpr = length === undefined ? undefined : valueToDefaultExpr$1(length);
    return fieldExpr.substring(positionExpr, lengthExpr);
}
function add(first, second) {
    return fieldOrExpression$1(first).add(valueToDefaultExpr$1(second));
}
function subtract(left, right) {
    const normalizedLeft = typeof left === 'string' ? field(left) : left;
    const normalizedRight = valueToDefaultExpr$1(right);
    return normalizedLeft.subtract(normalizedRight);
}
function multiply(first, second) {
    return fieldOrExpression$1(first).multiply(valueToDefaultExpr$1(second));
}
function divide(left, right) {
    const normalizedLeft = typeof left === 'string' ? field(left) : left;
    const normalizedRight = valueToDefaultExpr$1(right);
    return normalizedLeft.divide(normalizedRight);
}
function mod(left, right) {
    const normalizedLeft = typeof left === 'string' ? field(left) : left;
    const normalizedRight = valueToDefaultExpr$1(right);
    return normalizedLeft.mod(normalizedRight);
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
 */
function map(elements) {
    return _map(elements);
}
function _map(elements, methodName) {
    const result = [];
    for (const key in elements) {
        if (Object.prototype.hasOwnProperty.call(elements, key)) {
            const value = elements[key];
            result.push(constant(key));
            result.push(valueToDefaultExpr$1(value));
        }
    }
    return new FunctionExpression('map', result, 'map');
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
function _mapValue(plainObject) {
    const result = new Map();
    for (const key in plainObject) {
        if (Object.prototype.hasOwnProperty.call(plainObject, key)) {
            const value = plainObject[key];
            result.set(key, valueToDefaultExpr$1(value));
        }
    }
    return new MapValue(result, undefined);
}
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
function array(elements) {
    return _array(elements, 'array');
}
function _array(elements, methodName) {
    return new FunctionExpression('array', elements.map(element => valueToDefaultExpr$1(element)), methodName);
}
function equal(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.equal(rightExpr);
}
function notEqual(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.notEqual(rightExpr);
}
function lessThan(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.lessThan(rightExpr);
}
function lessThanOrEqual(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.lessThanOrEqual(rightExpr);
}
function greaterThan(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.greaterThan(rightExpr);
}
function greaterThanOrEqual(left, right) {
    const leftExpr = left instanceof Expression ? left : field(left);
    const rightExpr = valueToDefaultExpr$1(right);
    return leftExpr.greaterThanOrEqual(rightExpr);
}
function arrayConcat(firstArray, secondArray, ...otherArrays) {
    const exprValues = otherArrays.map(element => valueToDefaultExpr$1(element));
    return fieldOrExpression$1(firstArray).arrayConcat(fieldOrExpression$1(secondArray), ...exprValues);
}
function arrayContains(array, element) {
    const arrayExpr = fieldOrExpression$1(array);
    const elementExpr = valueToDefaultExpr$1(element);
    return arrayExpr.arrayContains(elementExpr);
}
function arrayContainsAny(array, values) {
    // @ts-ignore implementation accepts both types
    return fieldOrExpression$1(array).arrayContainsAny(values);
}
function arrayContainsAll(array, values) {
    // @ts-ignore implementation accepts both types
    return fieldOrExpression$1(array).arrayContainsAll(values);
}
function arrayLength(array) {
    return fieldOrExpression$1(array).arrayLength();
}
function equalAny(element, values) {
    // @ts-ignore implementation accepts both types
    return fieldOrExpression$1(element).equalAny(values);
}
function notEqualAny(element, values) {
    // @ts-ignore implementation accepts both types
    return fieldOrExpression$1(element).notEqualAny(values);
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
 */
function xor(first, second, ...additionalConditions) {
    return new FunctionExpression('xor', [first, second, ...additionalConditions], 'xor').asBoolean();
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
 */
function conditional(condition, thenExpr, elseExpr) {
    return new FunctionExpression('conditional', [condition, thenExpr, elseExpr], 'conditional');
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
 */
function not(booleanExpr) {
    return booleanExpr.not();
}
function logicalMaximum(first, second, ...others) {
    return fieldOrExpression$1(first).logicalMaximum(valueToDefaultExpr$1(second), ...others.map(value => valueToDefaultExpr$1(value)));
}
function logicalMinimum(first, second, ...others) {
    return fieldOrExpression$1(first).logicalMinimum(valueToDefaultExpr$1(second), ...others.map(value => valueToDefaultExpr$1(value)));
}
function exists(valueOrField) {
    return fieldOrExpression$1(valueOrField).exists();
}
function reverse(expr) {
    return fieldOrExpression$1(expr).reverse();
}
function byteLength(expr) {
    const normalizedExpr = fieldOrExpression$1(expr);
    return normalizedExpr.byteLength();
}
function exp(expressionOrFieldName) {
    return fieldOrExpression$1(expressionOrFieldName).exp();
}
function ceil(expr) {
    return fieldOrExpression$1(expr).ceil();
}
function floor(expr) {
    return fieldOrExpression$1(expr).floor();
}
/**
 * Creates an aggregation that counts the number of distinct values of a field.
 *
 * @param expr - The expression or field to count distinct values of.
 * @returns A new `AggregateFunction` representing the 'count_distinct' aggregation.
 */
function countDistinct(expr) {
    return fieldOrExpression$1(expr).countDistinct();
}
function charLength(value) {
    const valueExpr = fieldOrExpression$1(value);
    return valueExpr.charLength();
}
function like(left, pattern) {
    const leftExpr = fieldOrExpression$1(left);
    const patternExpr = valueToDefaultExpr$1(pattern);
    return leftExpr.like(patternExpr);
}
function regexContains(left, pattern) {
    const leftExpr = fieldOrExpression$1(left);
    const patternExpr = valueToDefaultExpr$1(pattern);
    return leftExpr.regexContains(patternExpr);
}
function arrayFilter(array, alias, filter) {
    return fieldOrExpression$1(array).arrayFilter(alias, filter);
}
function arrayTransform(array, elementAlias, transform) {
    return fieldOrExpression$1(array).arrayTransform(elementAlias, transform);
}
function arrayTransformWithIndex(array, elementAlias, indexAlias, transform) {
    return fieldOrExpression$1(array).arrayTransformWithIndex(elementAlias, indexAlias, transform);
}
function arraySlice(array, offset, length) {
    return fieldOrExpression$1(array).arraySlice(offset, length);
}
function arrayFirst(array) {
    return fieldOrExpression$1(array).arrayFirst();
}
function arrayFirstN(array, n) {
    return fieldOrExpression$1(array).arrayFirstN(valueToDefaultExpr$1(n));
}
function arrayLast(array) {
    return fieldOrExpression$1(array).arrayLast();
}
function arrayLastN(array, n) {
    return fieldOrExpression$1(array).arrayLastN(valueToDefaultExpr$1(n));
}
function arrayMaximum(array) {
    return fieldOrExpression$1(array).arrayMaximum();
}
function arrayMaximumN(array, n) {
    return fieldOrExpression$1(array).arrayMaximumN(valueToDefaultExpr$1(n));
}
function arrayMinimum(array) {
    return fieldOrExpression$1(array).arrayMinimum();
}
function arrayMinimumN(array, n) {
    return fieldOrExpression$1(array).arrayMinimumN(valueToDefaultExpr$1(n));
}
function arrayIndexOf(array, search) {
    return fieldOrExpression$1(array).arrayIndexOf(valueToDefaultExpr$1(search));
}
function arrayLastIndexOf(array, search) {
    return fieldOrExpression$1(array).arrayLastIndexOf(valueToDefaultExpr$1(search));
}
function arrayIndexOfAll(array, search) {
    return fieldOrExpression$1(array).arrayIndexOfAll(valueToDefaultExpr$1(search));
}
function regexFind(left, pattern) {
    const leftExpr = fieldOrExpression$1(left);
    const patternExpr = valueToDefaultExpr$1(pattern);
    return leftExpr.regexFind(patternExpr);
}
function regexFindAll(left, pattern) {
    const leftExpr = fieldOrExpression$1(left);
    const patternExpr = valueToDefaultExpr$1(pattern);
    return leftExpr.regexFindAll(patternExpr);
}
function regexMatch(left, pattern) {
    const leftExpr = fieldOrExpression$1(left);
    const patternExpr = valueToDefaultExpr$1(pattern);
    return leftExpr.regexMatch(patternExpr);
}
function stringContains(left, substring) {
    const leftExpr = fieldOrExpression$1(left);
    const substringExpr = valueToDefaultExpr$1(substring);
    return leftExpr.stringContains(substringExpr);
}
function startsWith(expr, prefix) {
    return fieldOrExpression$1(expr).startsWith(valueToDefaultExpr$1(prefix));
}
function endsWith(expr, suffix) {
    return fieldOrExpression$1(expr).endsWith(valueToDefaultExpr$1(suffix));
}
function toLower(expr) {
    return fieldOrExpression$1(expr).toLower();
}
function toUpper(expr) {
    return fieldOrExpression$1(expr).toUpper();
}
function trim(expr, valueToTrim) {
    return fieldOrExpression$1(expr).trim(valueToTrim);
}
function ltrim(expr, valueToTrim) {
    return fieldOrExpression$1(expr).ltrim(valueToTrim);
}
function rtrim(expr, valueToTrim) {
    return fieldOrExpression$1(expr).rtrim(valueToTrim);
}
function type(fieldNameOrExpression) {
    return fieldOrExpression$1(fieldNameOrExpression).type();
}
function isType(fieldNameOrExpression, type) {
    return fieldOrExpression$1(fieldNameOrExpression).isType(type);
}
function stringConcat(first, second, ...elements) {
    return fieldOrExpression$1(first).stringConcat(valueToDefaultExpr$1(second), ...elements.map(valueToDefaultExpr$1));
}
function stringIndexOf(expr, search) {
    return fieldOrExpression$1(expr).stringIndexOf(search);
}
function stringRepeat(expr, repetitions) {
    return fieldOrExpression$1(expr).stringRepeat(repetitions);
}
function stringReplaceAll(expr, find, replacement) {
    return fieldOrExpression$1(expr).stringReplaceAll(find, replacement);
}
function stringReplaceOne(expr, find, replacement) {
    return fieldOrExpression$1(expr).stringReplaceOne(find, replacement);
}
function mapGet(fieldOrExpr, subField) {
    return fieldOrExpression$1(fieldOrExpr).mapGet(subField);
}
function mapSet(fieldOrExpr, key, value, ...moreKeyValues) {
    return fieldOrExpression$1(fieldOrExpr).mapSet(key, value, ...moreKeyValues);
}
function mapKeys(fieldOrExpr) {
    return fieldOrExpression$1(fieldOrExpr).mapKeys();
}
function mapValues(fieldOrExpr) {
    return fieldOrExpression$1(fieldOrExpr).mapValues();
}
function mapEntries(fieldOrExpr) {
    return fieldOrExpression$1(fieldOrExpr).mapEntries();
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
 */
function countAll() {
    return AggregateFunction._create('count', [], 'count');
}
function count(value) {
    return fieldOrExpression$1(value).count();
}
function sum(value) {
    return fieldOrExpression$1(value).sum();
}
function average(value) {
    return fieldOrExpression$1(value).average();
}
function minimum(value) {
    return fieldOrExpression$1(value).minimum();
}
function maximum(value) {
    return fieldOrExpression$1(value).maximum();
}
function first(value) {
    return fieldOrExpression$1(value).first();
}
function last(value) {
    return fieldOrExpression$1(value).last();
}
function arrayAgg(value) {
    return fieldOrExpression$1(value).arrayAgg();
}
function arrayAggDistinct(value) {
    return fieldOrExpression$1(value).arrayAggDistinct();
}
function cosineDistance(expr, other) {
    const expr1 = fieldOrExpression$1(expr);
    const expr2 = vectorToExpr$1(other);
    return expr1.cosineDistance(expr2);
}
function dotProduct(expr, other) {
    const expr1 = fieldOrExpression$1(expr);
    const expr2 = vectorToExpr$1(other);
    return expr1.dotProduct(expr2);
}
function euclideanDistance(expr, other) {
    const expr1 = fieldOrExpression$1(expr);
    const expr2 = vectorToExpr$1(other);
    return expr1.euclideanDistance(expr2);
}
function vectorLength(expr) {
    return fieldOrExpression$1(expr).vectorLength();
}
function unixMicrosToTimestamp(expr) {
    return fieldOrExpression$1(expr).unixMicrosToTimestamp();
}
function timestampToUnixMicros(expr) {
    return fieldOrExpression$1(expr).timestampToUnixMicros();
}
function unixMillisToTimestamp(expr) {
    const normalizedExpr = fieldOrExpression$1(expr);
    return normalizedExpr.unixMillisToTimestamp();
}
function timestampToUnixMillis(expr) {
    const normalizedExpr = fieldOrExpression$1(expr);
    return normalizedExpr.timestampToUnixMillis();
}
function unixSecondsToTimestamp(expr) {
    const normalizedExpr = fieldOrExpression$1(expr);
    return normalizedExpr.unixSecondsToTimestamp();
}
function timestampToUnixSeconds(expr) {
    const normalizedExpr = fieldOrExpression$1(expr);
    return normalizedExpr.timestampToUnixSeconds();
}
function timestampAdd(timestamp, unit, amount) {
    const normalizedTimestamp = fieldOrExpression$1(timestamp);
    const normalizedUnit = valueToDefaultExpr$1(unit);
    const normalizedAmount = valueToDefaultExpr$1(amount);
    return normalizedTimestamp.timestampAdd(normalizedUnit, normalizedAmount);
}
function timestampSubtract(timestamp, unit, amount) {
    const normalizedTimestamp = fieldOrExpression$1(timestamp);
    const normalizedUnit = valueToDefaultExpr$1(unit);
    const normalizedAmount = valueToDefaultExpr$1(amount);
    return normalizedTimestamp.timestampSubtract(normalizedUnit, normalizedAmount);
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
 */
function currentTimestamp() {
    return new FunctionExpression('current_timestamp', [], 'currentTimestamp');
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
 */
function and(first, second, ...more) {
    return new FunctionExpression('and', [first, second, ...more], 'and').asBoolean();
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
 */
function or(first, second, ...more) {
    return new FunctionExpression('or', [first, second, ...more], 'xor').asBoolean();
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
 */
function nor(first, second, ...more) {
    return new FunctionExpression('nor', [first, second, ...more], 'nor').asBoolean();
}
function pow(base, exponent) {
    return fieldOrExpression$1(base).pow(exponent);
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
 */
function rand() {
    return new FunctionExpression('rand', [], 'rand');
}
function round(expr, decimalPlaces) {
    if (decimalPlaces === undefined) {
        return fieldOrExpression$1(expr).round();
    }
    else {
        return fieldOrExpression$1(expr).round(valueToDefaultExpr$1(decimalPlaces));
    }
}
function trunc(expr, decimalPlaces) {
    if (decimalPlaces === undefined) {
        return fieldOrExpression$1(expr).trunc();
    }
    else {
        return fieldOrExpression$1(expr).trunc(valueToDefaultExpr$1(decimalPlaces));
    }
}
function collectionId(expr) {
    return fieldOrExpression$1(expr).collectionId();
}
function length(expr) {
    return fieldOrExpression$1(expr).length();
}
function ln(expr) {
    return fieldOrExpression$1(expr).ln();
}
function log(expr, base) {
    return new FunctionExpression('log', [
        fieldOrExpression$1(expr),
        valueToDefaultExpr$1(base)
    ]);
}
function sqrt(expr) {
    return fieldOrExpression$1(expr).sqrt();
}
function stringReverse(expr) {
    return fieldOrExpression$1(expr).stringReverse();
}
function concat(fieldNameOrExpression, second, ...others) {
    return new FunctionExpression('concat', [
        fieldOrExpression$1(fieldNameOrExpression),
        valueToDefaultExpr$1(second),
        ...others.map(valueToDefaultExpr$1)
    ]);
}
function abs(expr) {
    return fieldOrExpression$1(expr).abs();
}
function ifAbsent(fieldNameOrExpression, elseValue) {
    return fieldOrExpression$1(fieldNameOrExpression).ifAbsent(valueToDefaultExpr$1(elseValue));
}
function ifNull(fieldNameOrExpression, elseValue) {
    return fieldOrExpression$1(fieldNameOrExpression).ifNull(elseValue);
}
function coalesce(fieldNameOrExpression, replacement, ...others) {
    return fieldOrExpression$1(fieldNameOrExpression).coalesce(replacement, ...others);
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
 */
function switchOn(condition, result, ...others) {
    return new FunctionExpression('switch_on', [
        valueToDefaultExpr$1(condition),
        valueToDefaultExpr$1(result),
        ...others.map(valueToDefaultExpr$1)
    ], 'switchOn');
}
function join(fieldNameOrExpression, delimiterValueOrExpression) {
    return fieldOrExpression$1(fieldNameOrExpression).join(valueToDefaultExpr$1(delimiterValueOrExpression));
}
function log10(expr) {
    return fieldOrExpression$1(expr).log10();
}
function arraySum(expr) {
    return fieldOrExpression$1(expr).arraySum();
}
function split(fieldNameOrExpression, delimiter) {
    return fieldOrExpression$1(fieldNameOrExpression).split(valueToDefaultExpr$1(delimiter));
}
function timestampTruncate(fieldNameOrExpression, granularity, timezone) {
    const internalGranularity = commonE4edcbc6_node.isString(granularity)
        ? valueToDefaultExpr$1(granularity)
        : granularity;
    return fieldOrExpression$1(fieldNameOrExpression).timestampTruncate(internalGranularity, timezone);
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
 */
function variable(name) {
    return new VariableExpression(name);
}
/**
 * @internal
 *
 * Expression representing a variable reference. This evaluates to the value of a variable
 * defined in a pipeline.
 */
class VariableExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(name) {
        super();
        this.name = name;
        this.expressionType = 'Variable';
    }
    /**
     * @internal
     */
    _toProto(_) {
        return {
            variableReferenceValue: this.name
        };
    }
    /**
     * @internal
     */
    _readUserData(_) { }
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
 */
function currentDocument() {
    return new FunctionExpression('current_document', []);
}
/**
 * @internal
 */
function pipelineValue(pipeline) {
    return new PipelineValueExpression(pipeline);
}
/**
 * @internal
 */
class PipelineValueExpression extends Expression {
    /**
     * @hideconstructor
     */
    constructor(pipeline) {
        super();
        this.pipeline = pipeline;
        this.expressionType = 'PipelineValue';
    }
    /**
     * @internal
     */
    _toProto(jsonProtoSerializer) {
        return commonE4edcbc6_node.toPipelineValue(this.pipeline._toProto(jsonProtoSerializer));
    }
    /**
     * @internal
     */
    _readUserData(context) {
        this.pipeline._readUserData(context);
    }
}
function timestampDiff(endFieldNameOrExpression, startFieldNameOrExpression, unit) {
    const normalizedEnd = fieldOrExpression$1(endFieldNameOrExpression);
    const normalizedStart = fieldOrExpression$1(startFieldNameOrExpression);
    const normalizedUnit = valueToDefaultExpr$1(unit);
    return normalizedEnd.timestampDiff(normalizedStart, normalizedUnit);
}
function timestampExtract(fieldNameOrExpression, part, timezone) {
    return fieldOrExpression$1(fieldNameOrExpression).timestampExtract(valueToDefaultExpr$1(part), timezone);
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
 */
function documentMatches(rquery) {
    return new FunctionExpression('document_matches', [valueToDefaultExpr$1(rquery)], 'documentMatches').asBoolean();
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
 */
function score() {
    return new FunctionExpression('score', [], 'score');
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
//
//   /**
//    * The maximum width of the string estimated for a variable width font. The
//    * unit is tenths of ems. The default is `160`.
//    */
//   maxSnippetWidth?: number;
//
//   /**
//    * The maximum number of non-contiguous pieces of text in the returned snippet.
//    * The default is `1`.
//    */
//   maxSnippets?: number;
//
//   /**
//    * The string to join the pieces. The default value is '\n'
//    */
//   separator?: string;
// }
//
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
//
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
 */
function geoDistance(fieldName, location) {
    return toField(fieldName).geoDistance(location);
}
function ascending(field) {
    return new Ordering(fieldOrExpression$1(field), 'ascending', 'ascending');
}
function descending(field) {
    return new Ordering(fieldOrExpression$1(field), 'descending', 'descending');
}
/**
 *
 * Represents an ordering criterion for sorting documents in a Firestore pipeline.
 *
 * You create `Ordering` instances using the `ascending` and `descending` helper functions.
 */
class Ordering {
    constructor(expr, direction, _methodName) {
        this.expr = expr;
        this.direction = direction;
        this._methodName = _methodName;
        this._protoValueType = 'ProtoValue';
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            mapValue: {
                fields: {
                    direction: commonE4edcbc6_node.toStringValue(this.direction),
                    expression: this.expr._toProto(serializer)
                }
            }
        };
    }
    /**
     * @private
     * @internal
     */
    _readUserData(context) {
        this.expr._readUserData(context);
    }
}
function isSelectable(val) {
    const candidate = val;
    return (candidate.selectable && commonE4edcbc6_node.isString(candidate.alias) && isExpr(candidate.expr));
}
function isOrdering(val) {
    const candidate = val;
    return (candidate !== undefined &&
        candidate !== null &&
        isExpr(candidate.expr) &&
        (candidate.direction === 'ascending' ||
            candidate.direction === 'descending'));
}
function isAliasedAggregate(val) {
    const candidate = val;
    return (commonE4edcbc6_node.isString(candidate.alias) &&
        candidate.aggregate instanceof AggregateFunction);
}
function isExpr(val) {
    return val instanceof Expression;
}
function isBooleanExpr(val) {
    return val instanceof BooleanExpression;
}
function isAliasedExpr(val) {
    return val instanceof AliasedExpression;
}
function isField(val) {
    return val instanceof Field;
}
function toField(value) {
    if (commonE4edcbc6_node.isString(value)) {
        const result = field(value);
        return result;
    }
    else {
        return value;
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
/* eslint @typescript-eslint/no-explicit-any: 0 */
function toPipelineBooleanExpr(f) {
    if (f instanceof commonE4edcbc6_node.FieldFilter) {
        const fieldValue = field(f.field.toString());
        // Comparison filters
        const value = f.value;
        switch (f.op) {
            case "<" /* Operator.LESS_THAN */:
                return and(fieldValue.exists(), fieldValue.lessThan(Constant._fromProto(value)));
            case "<=" /* Operator.LESS_THAN_OR_EQUAL */:
                return and(fieldValue.exists(), fieldValue.lessThanOrEqual(Constant._fromProto(value)));
            case ">" /* Operator.GREATER_THAN */:
                return and(fieldValue.exists(), fieldValue.greaterThan(Constant._fromProto(value)));
            case ">=" /* Operator.GREATER_THAN_OR_EQUAL */:
                return and(fieldValue.exists(), fieldValue.greaterThanOrEqual(Constant._fromProto(value)));
            case "==" /* Operator.EQUAL */:
                return and(fieldValue.exists(), fieldValue.equal(Constant._fromProto(value)));
            case "!=" /* Operator.NOT_EQUAL */:
                return fieldValue.notEqual(Constant._fromProto(value));
            case "array-contains" /* Operator.ARRAY_CONTAINS */:
                return and(fieldValue.exists(), fieldValue.arrayContains(Constant._fromProto(value)));
            case "in" /* Operator.IN */: {
                const values = value?.arrayValue?.values?.map((val) => Constant._fromProto(val));
                if (!values) {
                    return and(fieldValue.exists(), fieldValue.equalAny([]));
                }
                else if (values.length === 1) {
                    return and(fieldValue.exists(), fieldValue.equal(values[0]));
                }
                else {
                    return and(fieldValue.exists(), fieldValue.equalAny(values));
                }
            }
            case "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */: {
                const values = value?.arrayValue?.values?.map((val) => Constant._fromProto(val));
                return and(fieldValue.exists(), fieldValue.arrayContainsAny(values));
            }
            case "not-in" /* Operator.NOT_IN */: {
                const values = value?.arrayValue?.values?.map((val) => Constant._fromProto(val));
                if (!values) {
                    return fieldValue.notEqualAny([]);
                }
                else if (values.length === 1) {
                    return fieldValue.notEqual(values[0]);
                }
                else {
                    return fieldValue.notEqualAny(values);
                }
            }
            default:
                commonE4edcbc6_node.fail(0x9047);
        }
    }
    else if (f instanceof commonE4edcbc6_node.CompositeFilter) {
        switch (f.op) {
            case "and" /* CompositeOperator.AND */: {
                const conditions = f.getFilters().map(f => toPipelineBooleanExpr(f));
                return and(conditions[0], conditions[1], ...conditions.slice(2));
            }
            case "or" /* CompositeOperator.OR */: {
                const conditions = f.getFilters().map(f => toPipelineBooleanExpr(f));
                return or(conditions[0], conditions[1], ...conditions.slice(2));
            }
            default:
                commonE4edcbc6_node.fail(0x89ea);
        }
    }
    throw new Error(`Failed to convert filter to pipeline conditions: ${f}`);
}
function reverseOrderings(orderings) {
    return orderings.map(o => new Ordering(o.expr, o.direction === 'ascending' ? 'descending' : 'ascending', undefined));
}
function toPipeline(query, db) {
    let pipeline;
    if (commonE4edcbc6_node.isCollectionGroupQuery(query)) {
        pipeline = db.pipeline().collectionGroup(query.collectionGroup);
    }
    else if (commonE4edcbc6_node.isDocumentQuery$1(query)) {
        pipeline = db.pipeline().documents([commonE4edcbc6_node.doc(db, query.path.canonicalString())]);
    }
    else {
        pipeline = db.pipeline().collection(query.path.canonicalString());
    }
    // filters
    for (const filter of query.filters) {
        pipeline = pipeline.where(toPipelineBooleanExpr(filter));
    }
    // orders
    const orders = commonE4edcbc6_node.queryNormalizedOrderBy(query);
    const existsConditions = query.explicitOrderBy.map(order => field(order.field.canonicalString()).exists());
    if (existsConditions.length > 0) {
        const condition = existsConditions.length === 1
            ? existsConditions[0]
            : and(existsConditions[0], existsConditions[1], ...existsConditions.slice(2));
        pipeline = pipeline.where(condition);
    }
    const orderings = orders.map(order => order.dir === "asc" /* Direction.ASCENDING */
        ? field(order.field.canonicalString()).ascending()
        : field(order.field.canonicalString()).descending());
    if (orderings.length > 0) {
        if (query.limitType === "L" /* LimitType.Last */) {
            const actualOrderings = reverseOrderings(orderings);
            pipeline = pipeline.sort(actualOrderings[0], ...actualOrderings.slice(1));
            // cursors
            if (query.startAt !== null) {
                pipeline = pipeline.where(whereConditionsFromCursor(query.startAt, orderings, 'after'));
            }
            if (query.endAt !== null) {
                pipeline = pipeline.where(whereConditionsFromCursor(query.endAt, orderings, 'before'));
            }
            pipeline = pipeline.limit(query.limit);
            pipeline = pipeline.sort(orderings[0], ...orderings.slice(1));
        }
        else {
            pipeline = pipeline.sort(orderings[0], ...orderings.slice(1));
            if (query.startAt !== null) {
                pipeline = pipeline.where(whereConditionsFromCursor(query.startAt, orderings, 'after'));
            }
            if (query.endAt !== null) {
                pipeline = pipeline.where(whereConditionsFromCursor(query.endAt, orderings, 'before'));
            }
            if (query.limit !== null) {
                pipeline = pipeline.limit(query.limit);
            }
        }
    }
    return pipeline;
}
function whereConditionsFromCursor(bound, orderings, position) {
    // The filterFunc is either greater than or less than
    const filterFunc = position === 'before' ? lessThan : greaterThan;
    const cursors = bound.position.map(value => Constant._fromProto(value));
    const size = cursors.length;
    let field = orderings[size - 1].expr;
    let value = cursors[size - 1];
    // Add condition for last bound
    let condition = filterFunc(field, value);
    if (bound.inclusive) {
        // When the cursor bound is inclusive, then the last bound
        // can be equal to the value, otherwise it's not equal
        condition = or(condition, field.equal(value));
    }
    // Iterate backwards over the remaining bounds, adding
    // a condition for each one
    for (let i = size - 2; i >= 0; i--) {
        field = orderings[i].expr;
        value = cursors[i];
        // For each field in the orderings, the condition is either
        // a) lt|gt the cursor value,
        // b) or equal the cursor value and lt|gt the cursor values for other fields
        condition = or(filterFunc(field, value), and(field.equal(value), condition));
    }
    return condition;
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
 */
function selectablesToMap(selectables) {
    return new Map(Object.entries(selectablesToObject(selectables)));
}
function selectablesToObject(selectables) {
    const result = {};
    for (const selectable of selectables) {
        let alias;
        let expression;
        if (typeof selectable === 'string') {
            alias = selectable;
            expression = field(selectable);
        }
        else if (selectable instanceof Field) {
            alias = selectable.alias;
            expression = selectable.expr;
        }
        else if (selectable instanceof AliasedExpression) {
            alias = selectable.alias;
            expression = selectable.expr;
        }
        else {
            commonE4edcbc6_node.fail(0x5319, { selectable });
        }
        if (result[alias] !== undefined) {
            throw new commonE4edcbc6_node.FirestoreError('invalid-argument', `Duplicate alias or field '${alias}'`);
        }
        result[alias] = expression;
    }
    return result;
}
function aliasedAggregateToMap(aliasedAggregatees) {
    return aliasedAggregatees.reduce((map, selectable) => {
        if (map.get(selectable.alias) !== undefined) {
            throw new commonE4edcbc6_node.FirestoreError('invalid-argument', `Duplicate alias or field '${selectable.alias}'`);
        }
        map.set(selectable.alias, selectable.aggregate);
        return map;
    }, new Map());
}
/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */
function vectorToExpr(value) {
    if (value instanceof Expression) {
        return value;
    }
    else if (value instanceof commonE4edcbc6_node.VectorValue) {
        const result = constant(value);
        return result;
    }
    else if (Array.isArray(value)) {
        const result = constant(commonE4edcbc6_node.vector(value));
        return result;
    }
    else {
        throw new Error('Unsupported value: ' + typeof value);
    }
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
function fieldOrExpression(value) {
    if (commonE4edcbc6_node.isString(value)) {
        const result = field(value);
        return result;
    }
    else {
        return valueToDefaultExpr(value);
    }
}
/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */
function valueToDefaultExpr(value) {
    let result;
    if (isFirestoreValue(value)) {
        return constant(value);
    }
    if (value instanceof Expression) {
        return value;
    }
    else if (commonE4edcbc6_node.isPlainObject(value)) {
        result = map(value);
    }
    else if (value instanceof Array) {
        result = array(value);
    }
    else if (isPipeline$1(value)) {
        result = pipelineValue(value);
    }
    else {
        result = _constant(value, undefined);
    }
    return result;
}
/**
 * Checks if a value is a Pipeline object.
 *
 * We use duck typing here to avoid a circular dependency between pipeline.ts and pipeline_util.ts.
 */
function isPipeline$1(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.toArrayExpression === 'function');
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
class Stage {
    constructor(options) {
        /**
         * Store _optionsProto parsed by _readUserData.
         * @private
         * @internal
         * @protected
         */
        this.optionsProto = undefined;
        ({ rawOptions: this.rawOptions, ...this.knownOptions } = options);
    }
    _readUserData(context) {
        this.optionsProto = this._optionsUtil.getOptionsProto(context, this.knownOptions, this.rawOptions);
    }
    _toProto(_) {
        return {
            name: this._name,
            options: this.optionsProto
        };
    }
}
class AddFields extends Stage {
    get _name() {
        return 'add_fields';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(fields, options) {
        super(options);
        this.fields = fields;
    }
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toMapValue(serializer, this.fields)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.fields, context);
    }
}
class RemoveFields extends Stage {
    get _name() {
        return 'remove_fields';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(fields, options) {
        super(options);
        this.fields = fields;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: this.fields.map(f => f._toProto(serializer))
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.fields, context);
    }
}
/**
 * @public
 */
class Define extends Stage {
    get _name() {
        return 'let';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(aliasedExpressions, options) {
        super(options);
        this.aliasedExpressions = aliasedExpressions;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toMapValue(serializer, this.aliasedExpressions)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.aliasedExpressions, context);
    }
}
class Aggregate extends Stage {
    get _name() {
        return 'aggregate';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(groups, accumulators, options) {
        super(options);
        this.groups = groups;
        this.accumulators = accumulators;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [
                commonE4edcbc6_node.toMapValue(serializer, this.accumulators),
                commonE4edcbc6_node.toMapValue(serializer, this.groups)
            ]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.groups, context);
        readUserDataHelper(this.accumulators, context);
    }
}
class Distinct extends Stage {
    get _name() {
        return 'distinct';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(groups, options) {
        super(options);
        this.groups = groups;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toMapValue(serializer, this.groups)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.groups, context);
    }
}
class CollectionSource extends Stage {
    get _name() {
        return 'collection';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({
            forceIndex: {
                serverName: 'force_index'
            }
        });
    }
    constructor(collection, options) {
        super(options);
        // prepend slash to collection string
        this.formattedCollectionPath = collection.startsWith('/')
            ? collection
            : '/' + collection;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [{ referenceValue: this.formattedCollectionPath }]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class CollectionGroupSource extends Stage {
    get _name() {
        return 'collection_group';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({
            forceIndex: {
                serverName: 'force_index'
            }
        });
    }
    constructor(collectionId, options) {
        super(options);
        this.collectionId = collectionId;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [{ referenceValue: '' }, { stringValue: this.collectionId }]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class SubcollectionSource extends Stage {
    get _name() {
        return 'subcollection';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(path, options) {
        super(options);
        this.path = path;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [{ stringValue: this.path }]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class DatabaseSource extends Stage {
    get _name() {
        return 'database';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer)
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class DocumentsSource extends Stage {
    get _name() {
        return 'documents';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(docPaths, options) {
        super(options);
        this.formattedPaths = docPaths.map(path => path.startsWith('/') ? path : '/' + path);
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: this.formattedPaths.map(p => {
                return { referenceValue: p };
            })
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class Where extends Stage {
    get _name() {
        return 'where';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(condition, options) {
        super(options);
        this.condition = condition;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [this.condition._toProto(serializer)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.condition, context);
    }
}
class FindNearest extends Stage {
    get _name() {
        return 'find_nearest';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({
            limit: {
                serverName: 'limit'
            },
            distanceField: {
                serverName: 'distance_field'
            }
        });
    }
    constructor(vectorValue, field, distanceMeasure, options) {
        super(options);
        this.vectorValue = vectorValue;
        this.field = field;
        this.distanceMeasure = distanceMeasure;
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [
                this.field._toProto(serializer),
                this.vectorValue._toProto(serializer),
                commonE4edcbc6_node.toStringValue(this.distanceMeasure)
            ]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.vectorValue, context);
        readUserDataHelper(this.field, context);
    }
}
class Limit extends Stage {
    get _name() {
        return 'limit';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(limit, options) {
        commonE4edcbc6_node.hardAssert(!isNaN(limit) && limit !== Infinity && limit !== -Infinity, 0x882c);
        super(options);
        this.limit = limit;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toNumber(serializer, this.limit)]
        };
    }
}
class Offset extends Stage {
    get _name() {
        return 'offset';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(offset, options) {
        super(options);
        this.offset = offset;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toNumber(serializer, this.offset)]
        };
    }
}
class Select extends Stage {
    get _name() {
        return 'select';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(selections, options) {
        super(options);
        this.selections = selections;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toMapValue(serializer, this.selections)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.selections, context);
    }
}
class Sort extends Stage {
    get _name() {
        return 'sort';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(orderings, options) {
        super(options);
        this.orderings = orderings;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: this.orderings.map(o => o._toProto(serializer))
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.orderings, context);
    }
}
class Sample extends Stage {
    get _name() {
        return 'sample';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(rate, mode, options) {
        super(options);
        this.rate = rate;
        this.mode = mode;
    }
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toNumber(serializer, this.rate), commonE4edcbc6_node.toStringValue(this.mode)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
    }
}
class Union extends Stage {
    get _name() {
        return 'union';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(other, options) {
        super(options);
        this.other = other;
    }
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [commonE4edcbc6_node.toPipelineValue(this.other._toProto(serializer))]
        };
    }
    _readUserData(context) {
        this.other._readUserData(context);
        super._readUserData(context);
    }
}
class Unnest extends Stage {
    get _name() {
        return 'unnest';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({
            indexField: {
                serverName: 'index_field'
            }
        });
    }
    constructor(alias, expr, options) {
        super(options);
        this.alias = alias;
        this.expr = expr;
    }
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [
                this.expr._toProto(serializer),
                field(this.alias)._toProto(serializer)
            ]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.expr, context);
    }
}
class Replace extends Stage {
    get _name() {
        return 'replace_with';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
    constructor(map, options) {
        super(options);
        this.map = map;
    }
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: [this.map._toProto(serializer), commonE4edcbc6_node.toStringValue(Replace.MODE)]
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.map, context);
    }
}
Replace.MODE = 'full_replace';
/**
 * @beta
 */
class Search extends Stage {
    constructor(_searchOptions) {
        super(_searchOptions);
        this._searchOptions = _searchOptions;
    }
    get _name() {
        return 'search';
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({
            query: {
                serverName: 'query'
            },
            limit: {
                serverName: 'limit'
            },
            retrievalDepth: {
                serverName: 'retrieval_depth'
            },
            sort: {
                serverName: 'sort'
            },
            addFields: {
                serverName: 'add_fields'
            },
            select: {
                serverName: 'select'
            },
            offset: {
                serverName: 'offset'
            },
            queryEnhancement: {
                serverName: 'query_enhancement'
            },
            languageCode: {
                serverName: 'language_code'
            }
        });
    }
    /**
     * @private
     * @internal
     */
    _toProto(serializer) {
        return {
            ...super._toProto(serializer),
            args: []
        };
    }
    _readUserData(context) {
        readUserDataHelper(this._searchOptions.query, context);
        if (this._searchOptions.addFields) {
            readUserDataHelper(this._searchOptions.addFields, context);
        }
        if (this._searchOptions.select) {
            readUserDataHelper(this._searchOptions.select, context);
        }
        if (this._searchOptions.sort) {
            readUserDataHelper(this._searchOptions.sort, context);
        }
        super._readUserData(context);
    }
}
/**
 * @beta
 */
class RawStage extends Stage {
    /**
     * @private
     * @internal
     */
    constructor(name, params, rawOptions) {
        super({ rawOptions });
        this.name = name;
        this.params = params;
    }
    /**
     * @internal
     * @private
     */
    _toProto(serializer) {
        return {
            name: this.name,
            args: this.params.map(o => o._toProto(serializer)),
            options: this.optionsProto
        };
    }
    _readUserData(context) {
        super._readUserData(context);
        readUserDataHelper(this.params, context);
    }
    get _name() {
        return this.name;
    }
    get _optionsUtil() {
        return new commonE4edcbc6_node.OptionsUtil({});
    }
}
/**
 * Helper to read user data across a number of different formats.
 * @param name - Name of the calling function. Used for error messages when invalid user data is encountered.
 * @param expressionMap
 * @returns the expressionMap argument.
 * @private
 */
function readUserDataHelper(expressionMap, context) {
    if (commonE4edcbc6_node.isUserData(expressionMap)) {
        expressionMap._readUserData(context);
    }
    else if (Array.isArray(expressionMap)) {
        expressionMap.forEach(readableData => readableData._readUserData(context));
    }
    else if (expressionMap instanceof Map) {
        expressionMap.forEach(expr => expr._readUserData(context));
    }
    else {
        Object.values(expressionMap).forEach(expression => expression._readUserData(context));
    }
    return expressionMap;
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
 */
class Pipeline$1 {
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
    _db, 
    /**
     * @internal
     * @private
     */
    stages) {
        this._db = _db;
        this.stages = stages;
    }
    _readUserData(context) {
        this.stages.forEach(stage => {
            const subContext = context.contextWith({
                methodName: stage._name
            });
            stage._readUserData(subContext);
        });
    }
    addFields(fieldOrOptions, ...additionalFields) {
        // Process argument union(s) from method overloads
        let fields;
        let options;
        if (isSelectable(fieldOrOptions)) {
            fields = [fieldOrOptions, ...additionalFields];
            options = {};
        }
        else {
            ({ fields, ...options } = fieldOrOptions);
        }
        // Convert user land convenience types to internal types
        const normalizedFields = selectablesToMap(fields);
        // Create stage object
        const stage = new AddFields(normalizedFields, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    removeFields(fieldValueOrOptions, ...additionalFields) {
        // Process argument union(s) from method overloads
        const options = isField(fieldValueOrOptions) || commonE4edcbc6_node.isString(fieldValueOrOptions)
            ? {}
            : fieldValueOrOptions;
        const fields = isField(fieldValueOrOptions) || commonE4edcbc6_node.isString(fieldValueOrOptions)
            ? [fieldValueOrOptions, ...additionalFields]
            : fieldValueOrOptions.fields;
        // Convert user land convenience types to internal types
        const convertedFields = fields.map(f => commonE4edcbc6_node.isString(f) ? field(f) : f);
        // Create stage object
        const stage = new RemoveFields(convertedFields, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    define(aliasedExpressionOrOptions, ...additionalExpressions) {
        // Process argument union(s) from method overloads
        const options = isAliasedExpr(aliasedExpressionOrOptions)
            ? {}
            : aliasedExpressionOrOptions;
        const aliasedExpressions = isAliasedExpr(aliasedExpressionOrOptions)
            ? [aliasedExpressionOrOptions, ...additionalExpressions]
            : aliasedExpressionOrOptions.variables;
        const convertedExpressions = selectablesToMap(aliasedExpressions);
        const stage = new Define(convertedExpressions, options);
        return this._addStage(stage);
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
     */
    toArrayExpression() {
        return new FunctionExpression('array', [fieldOrExpression(this)]);
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
     */
    toScalarExpression() {
        return new FunctionExpression('scalar', [fieldOrExpression(this)]);
    }
    select(selectionOrOptions, ...additionalSelections) {
        // Process argument union(s) from method overloads
        const options = isSelectable(selectionOrOptions) || commonE4edcbc6_node.isString(selectionOrOptions)
            ? {}
            : selectionOrOptions;
        const selections = isSelectable(selectionOrOptions) || commonE4edcbc6_node.isString(selectionOrOptions)
            ? [selectionOrOptions, ...additionalSelections]
            : selectionOrOptions.selections;
        // Convert user land convenience types to internal types
        const normalizedSelections = selectablesToMap(selections);
        // Create stage object
        const stage = new Select(normalizedSelections, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    where(conditionOrOptions) {
        // Process argument union(s) from method overloads
        const options = isBooleanExpr(conditionOrOptions) ? {} : conditionOrOptions;
        const condition = isBooleanExpr(conditionOrOptions)
            ? conditionOrOptions
            : conditionOrOptions.condition;
        // Create stage object
        const stage = new Where(condition, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    offset(offsetOrOptions) {
        // Process argument union(s) from method overloads
        let options;
        let offset;
        if (commonE4edcbc6_node.isNumber$1(offsetOrOptions)) {
            options = {};
            offset = offsetOrOptions;
        }
        else {
            options = offsetOrOptions;
            offset = offsetOrOptions.offset;
        }
        // Create stage object
        const stage = new Offset(offset, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    limit(limitOrOptions) {
        // Process argument union(s) from method overloads
        const options = commonE4edcbc6_node.isNumber$1(limitOrOptions) ? {} : limitOrOptions;
        const limit = commonE4edcbc6_node.isNumber$1(limitOrOptions)
            ? limitOrOptions
            : limitOrOptions.limit;
        // Create stage object
        const stage = new Limit(limit, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    distinct(groupOrOptions, ...additionalGroups) {
        // Process argument union(s) from method overloads
        const options = commonE4edcbc6_node.isString(groupOrOptions) || isSelectable(groupOrOptions)
            ? {}
            : groupOrOptions;
        const groups = commonE4edcbc6_node.isString(groupOrOptions) || isSelectable(groupOrOptions)
            ? [groupOrOptions, ...additionalGroups]
            : groupOrOptions.groups;
        // Convert user land convenience types to internal types
        const convertedGroups = selectablesToMap(groups);
        // Create stage object
        const stage = new Distinct(convertedGroups, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    aggregate(targetOrOptions, ...rest) {
        // Process argument union(s) from method overloads
        const options = isAliasedAggregate(targetOrOptions) ? {} : targetOrOptions;
        const accumulators = isAliasedAggregate(targetOrOptions)
            ? [targetOrOptions, ...rest]
            : targetOrOptions.accumulators;
        const groups = isAliasedAggregate(targetOrOptions)
            ? []
            : targetOrOptions.groups ?? [];
        // Convert user land convenience types to internal types
        const convertedAccumulators = aliasedAggregateToMap(accumulators);
        const convertedGroups = selectablesToMap(groups);
        // Create stage object
        const stage = new Aggregate(convertedGroups, convertedAccumulators, options);
        // Add stage to the pipeline
        return this._addStage(stage);
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
     */
    findNearest(options) {
        // Convert user land convenience types to internal types
        const field = toField(options.field);
        const vectorValue = vectorToExpr(options.vectorValue);
        const distanceField = options.distanceField
            ? toField(options.distanceField)
            : undefined;
        const internalOptions = {
            distanceField,
            limit: options.limit,
            rawOptions: options.rawOptions
        };
        // Create stage object
        const stage = new FindNearest(vectorValue, field, options.distanceMeasure, internalOptions);
        // Add stage to the pipeline
        return this._addStage(stage);
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
    search(options) {
        // Convert user land convenience types to internal types
        const addFields = options.addFields
            ? selectablesToObject(options.addFields)
            : undefined;
        const query = isExpr(options.query)
            ? options.query
            : documentMatches(options.query);
        const sort = isOrdering(options.sort)
            ? [options.sort]
            : options.sort;
        const select = undefined;
        // TODO(search) enable with backend support
        // select = options.select
        //   ? selectablesToObject(options.select)
        //   : undefined;
        const internalOptions = {
            ...options,
            addFields,
            select,
            query,
            sort
        };
        // Create stage object
        const stage = new Search(internalOptions);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    sort(orderingOrOptions, ...additionalOrderings) {
        // Process argument union(s) from method overloads
        const options = isOrdering(orderingOrOptions) ? {} : orderingOrOptions;
        const orderings = isOrdering(orderingOrOptions)
            ? [orderingOrOptions, ...additionalOrderings]
            : orderingOrOptions.orderings;
        // Create stage object
        const stage = new Sort(orderings, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    replaceWith(valueOrOptions) {
        // Process argument union(s) from method overloads
        const options = commonE4edcbc6_node.isString(valueOrOptions) || isExpr(valueOrOptions) ? {} : valueOrOptions;
        const fieldNameOrExpr = commonE4edcbc6_node.isString(valueOrOptions) || isExpr(valueOrOptions)
            ? valueOrOptions
            : valueOrOptions.map;
        // Convert user land convenience types to internal types
        const mapExpr = fieldOrExpression(fieldNameOrExpr);
        // Create stage object
        const stage = new Replace(mapExpr, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    sample(documentsOrOptions) {
        // Process argument union(s) from method overloads
        const options = commonE4edcbc6_node.isNumber$1(documentsOrOptions) ? {} : documentsOrOptions;
        let rate;
        let mode;
        if (commonE4edcbc6_node.isNumber$1(documentsOrOptions)) {
            rate = documentsOrOptions;
            mode = 'documents';
        }
        else if (commonE4edcbc6_node.isNumber$1(documentsOrOptions.documents)) {
            rate = documentsOrOptions.documents;
            mode = 'documents';
        }
        else {
            rate = documentsOrOptions.percentage;
            mode = 'percent';
        }
        // Create stage object
        const stage = new Sample(rate, mode, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    union(otherOrOptions) {
        // Process argument union(s) from method overloads
        let options;
        let otherPipeline;
        if (isPipeline(otherOrOptions)) {
            options = {};
            otherPipeline = otherOrOptions;
        }
        else {
            ({ other: otherPipeline, ...options } = otherOrOptions);
        }
        // Create stage object
        const stage = new Union(otherPipeline, options);
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    unnest(selectableOrOptions, indexField) {
        // Process argument union(s) from method overloads
        let options;
        let selectable;
        let indexFieldName;
        if (isSelectable(selectableOrOptions)) {
            options = {};
            selectable = selectableOrOptions;
            indexFieldName = indexField;
        }
        else {
            ({
                selectable,
                indexField: indexFieldName,
                ...options
            } = selectableOrOptions);
        }
        // Convert user land convenience types to internal types
        const alias = selectable.alias;
        const expr = selectable.expr;
        if (commonE4edcbc6_node.isString(indexFieldName)) {
            options.indexField = _field(indexFieldName, 'unnest');
        }
        // Create stage object
        const stage = new Unnest(alias, expr, options);
        // Add stage to the pipeline
        return this._addStage(stage);
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
     */
    rawStage(name, params, options) {
        // Convert user land convenience types to internal types
        const expressionParams = params.map((value) => {
            if (value instanceof Expression) {
                return value;
            }
            else if (value instanceof AggregateFunction) {
                return value;
            }
            else if (commonE4edcbc6_node.isPlainObject(value)) {
                return _mapValue(value);
            }
            else {
                return _constant(value, 'rawStage');
            }
        });
        // Create stage object
        const stage = new RawStage(name, expressionParams, options ?? {});
        // Add stage to the pipeline
        return this._addStage(stage);
    }
    /**
     * @internal
     * @private
     */
    _toProto(jsonProtoSerializer) {
        const stages = this.stages.map(stage => stage._toProto(jsonProtoSerializer));
        return { stages };
    }
    _addStage(stage) {
        const copy = this.stages.map(s => s);
        copy.push(stage);
        return this.newPipeline(this._db, copy);
    }
    /**
     * @internal
     * @private
     * @param db
     * @param userDataReader
     * @param userDataWriter
     * @param stages
     * @protected
     */
    newPipeline(db, stages) {
        return new Pipeline$1(db, stages);
    }
}
function isPipeline(val) {
    return val instanceof Pipeline$1;
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
 */
class PipelineSource {
    /**
     * @internal
     * @private
     * @param databaseId
     * @param _createPipeline
     */
    constructor(databaseId, 
    /**
     * @internal
     * @private
     */
    _createPipeline) {
        this.databaseId = databaseId;
        this._createPipeline = _createPipeline;
    }
    collection(collectionOrOptions) {
        // Process argument union(s) from method overloads
        const options = commonE4edcbc6_node.isString(collectionOrOptions) ||
            commonE4edcbc6_node.isCollectionReference(collectionOrOptions)
            ? {}
            : collectionOrOptions;
        const collectionRefOrString = commonE4edcbc6_node.isString(collectionOrOptions) ||
            commonE4edcbc6_node.isCollectionReference(collectionOrOptions)
            ? collectionOrOptions
            : collectionOrOptions.collection;
        // Validate that a user provided reference is for the same Firestore DB
        if (commonE4edcbc6_node.isCollectionReference(collectionRefOrString)) {
            this._validateReference(collectionRefOrString);
        }
        // Convert user land convenience types to internal types
        const normalizedCollection = commonE4edcbc6_node.isString(collectionRefOrString)
            ? collectionRefOrString
            : collectionRefOrString.path;
        // Create stage object
        const stage = new CollectionSource(normalizedCollection, options);
        // Add stage to the pipeline
        return this._createPipeline([stage]);
    }
    collectionGroup(collectionIdOrOptions) {
        // Process argument union(s) from method overloads
        let collectionId;
        let options;
        if (commonE4edcbc6_node.isString(collectionIdOrOptions)) {
            collectionId = collectionIdOrOptions;
            options = {};
        }
        else {
            ({ collectionId, ...options } = collectionIdOrOptions);
        }
        // Create stage object
        const stage = new CollectionGroupSource(collectionId, options);
        // Add stage to the pipeline
        return this._createPipeline([stage]);
    }
    database(options) {
        // Process argument union(s) from method overloads
        options = options ?? {};
        // Create stage object
        const stage = new DatabaseSource(options);
        // Add stage to the pipeline
        return this._createPipeline([stage]);
    }
    documents(docsOrOptions) {
        // Process argument union(s) from method overloads
        let options;
        let docs;
        if (Array.isArray(docsOrOptions)) {
            docs = docsOrOptions;
            options = {};
        }
        else {
            ({ docs, ...options } = docsOrOptions);
        }
        // Validate that all user provided references are for the same Firestore DB
        docs
            .filter(v => v instanceof commonE4edcbc6_node.DocumentReference)
            .forEach(dr => this._validateReference(dr));
        // Convert user land convenience types to internal types
        const normalizedDocs = docs.map(doc => commonE4edcbc6_node.isString(doc) ? doc : doc.path);
        // Create stage object
        const stage = new DocumentsSource(normalizedDocs, options);
        // Add stage to the pipeline
        return this._createPipeline([stage]);
    }
    /**
     * Convert the given Query into an equivalent Pipeline.
     *
     * @param query - A Query to be converted into a Pipeline.
     *
     * @throws `FirestoreError` Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
     */
    createFrom(query) {
        return toPipeline(query._query, query.firestore);
    }
    _validateReference(reference) {
        const refDbId = reference.firestore._databaseId;
        if (!refDbId.isEqual(this.databaseId)) {
            throw new commonE4edcbc6_node.FirestoreError(commonE4edcbc6_node.Code.INVALID_ARGUMENT, `Invalid ${reference instanceof commonE4edcbc6_node.CollectionReference
                ? 'CollectionReference'
                : 'DocumentReference'}. ` +
                `The project ID ("${refDbId.projectId}") or the database ("${refDbId.database}") does not match ` +
                `the project ID ("${this.databaseId.projectId}") and database ("${this.databaseId.database}") of the target database of this Pipeline.`);
        }
    }
}
function subcollection(pathOrOptions) {
    // Process argument union(s) from method overloads
    let path;
    let options;
    if (commonE4edcbc6_node.isString(pathOrOptions)) {
        path = pathOrOptions;
        options = {};
    }
    else {
        ({ path, ...options } = pathOrOptions);
    }
    // Create stage object
    const stage = new SubcollectionSource(path, options);
    return new Pipeline$1(undefined, [stage]);
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
 */
class PipelineSnapshot {
    constructor(pipeline, results, executionTime) {
        this._pipeline = pipeline;
        this._executionTime = executionTime;
        this._results = results;
    }
    /**
     * An array of all the results in the `PipelineSnapshot`.
     */
    get results() {
        return this._results;
    }
    /**
     * The time at which the pipeline producing this result is executed.
     *
     * @readonly
     *
     */
    get executionTime() {
        if (this._executionTime === undefined) {
            throw new Error("'executionTime' is expected to exist, but it is undefined");
        }
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
 */
class PipelineResult {
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
    constructor(userDataWriter, fields, ref, createTime, updateTime) {
        this._ref = ref;
        this._userDataWriter = userDataWriter;
        this._createTime = createTime;
        this._updateTime = updateTime;
        this._fields = fields;
    }
    /**
     * The reference of the document, if it is a document; otherwise `undefined`.
     */
    get ref() {
        return this._ref;
    }
    /**
     * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
     *
     * @readonly
     *
     */
    get id() {
        return this._ref?.id;
    }
    /**
     * The time the document was created. Undefined if this result is not a document.
     *
     * @readonly
     */
    get createTime() {
        return this._createTime;
    }
    /**
     * The time the document was last updated (at the time the snapshot was
     * generated). Undefined if this result is not a document.
     *
     * @readonly
     */
    get updateTime() {
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
     */
    data() {
        return this._userDataWriter.convertValue(this._fields.value);
    }
    /**
     * @internal
     * @private
     *
     * Retrieves all fields in the result as a proto value.
     *
     * @returns An `Object` containing all fields in the result.
     */
    _fieldsProto() {
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
    get(fieldPath) {
        if (this._fields === undefined) {
            return undefined;
        }
        if (isField(fieldPath)) {
            fieldPath = fieldPath.fieldName;
        }
        const value = this._fields.field(commonE4edcbc6_node.fieldPathFromArgument('DocumentSnapshot.get', fieldPath));
        if (value !== null) {
            return this._userDataWriter.convertValue(value);
        }
    }
}
/**
 * Test equality of two PipelineResults.
 * @param left - First PipelineResult to compare.
 * @param right - Second PipelineResult to compare.
 */
function pipelineResultEqual(left, right) {
    if (left === right) {
        return true;
    }
    return (commonE4edcbc6_node.isOptionalEqual(left._ref, right._ref, commonE4edcbc6_node.refEqual) &&
        commonE4edcbc6_node.isOptionalEqual(left._fields, right._fields, (l, r) => l.isEqual(r)));
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
class Pipeline extends Pipeline$1 {
    /**
     * @internal
     * @private
     * @param db
     * @param userDataWriter
     * @param stages
     * @protected
     */
    newPipeline(db, stages) {
        return new Pipeline(db, stages);
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
function execute(pipelineOrOptions) {
    const options = !(pipelineOrOptions instanceof Pipeline$1)
        ? pipelineOrOptions
        : {
            pipeline: pipelineOrOptions
        };
    const { pipeline, rawOptions, ...rest } = options;
    if (!pipeline._db) {
        return Promise.reject(new commonE4edcbc6_node.FirestoreError(commonE4edcbc6_node.Code.FAILED_PRECONDITION, 'This pipeline was created without a database (e.g., as a subcollection pipeline) and cannot be executed directly. It can only be used as part of another pipeline.'));
    }
    const firestore = commonE4edcbc6_node.cast(pipeline._db, commonE4edcbc6_node.Firestore);
    const client = commonE4edcbc6_node.ensureFirestoreConfigured(firestore);
    const userDataReader = commonE4edcbc6_node.newUserDataReader(firestore);
    const context = userDataReader.createContext(3 /* UserDataSource.Argument */, 'execute');
    pipeline._readUserData(context);
    const userDataWriter = new commonE4edcbc6_node.ExpUserDataWriter(firestore);
    const structuredPipelineOptions = new commonE4edcbc6_node.StructuredPipelineOptions(rest, rawOptions);
    structuredPipelineOptions._readUserData(context);
    const structuredPipeline = new commonE4edcbc6_node.StructuredPipeline(pipeline, structuredPipelineOptions);
    return commonE4edcbc6_node.firestoreClientExecutePipeline(client, structuredPipeline).then(result => {
        // Get the execution time from the first result.
        // firestoreClientExecutePipeline returns at least one PipelineStreamElement
        // even if the returned document set is empty.
        const executionTime = result.length > 0 ? result[0].executionTime?.toTimestamp() : undefined;
        const docs = result
            // Currently ignore any response from ExecutePipeline that does
            // not contain any document data in the `fields` property.
            .filter(element => !!element.fields)
            .map(element => new PipelineResult(userDataWriter, element.fields, element.key?.path
            ? new commonE4edcbc6_node.DocumentReference(firestore, null, element.key)
            : undefined, element.createTime?.toTimestamp(), element.updateTime?.toTimestamp()));
        return new PipelineSnapshot(pipeline, docs, executionTime);
    });
}
/**
 * Creates and returns a new PipelineSource, which allows specifying the source stage of a {@link @firebase/firestore/pipelines#Pipeline}.
 *
 * @example
 * ```
 * let myPipeline: Pipeline = firestore.pipeline().collection('books');
 * ```
 */
// Augment the Firestore class with the pipeline() factory method
commonE4edcbc6_node.Firestore.prototype.pipeline = function () {
    return new PipelineSource(this._databaseId, (stages) => {
        return new Pipeline(this, stages);
    });
};

exports._internalPipelineToExecutePipelineRequestProto = commonE4edcbc6_node._internalPipelineToExecutePipelineRequestProto;
exports.AggregateFunction = AggregateFunction;
exports.AliasedAggregate = AliasedAggregate;
exports.AliasedExpression = AliasedExpression;
exports.BooleanExpression = BooleanExpression;
exports.Expression = Expression;
exports.Field = Field;
exports.FunctionExpression = FunctionExpression;
exports.Ordering = Ordering;
exports.Pipeline = Pipeline;
exports.PipelineResult = PipelineResult;
exports.PipelineSnapshot = PipelineSnapshot;
exports.PipelineSource = PipelineSource;
exports.abs = abs;
exports.add = add;
exports.and = and;
exports.array = array;
exports.arrayAgg = arrayAgg;
exports.arrayAggDistinct = arrayAggDistinct;
exports.arrayConcat = arrayConcat;
exports.arrayContains = arrayContains;
exports.arrayContainsAll = arrayContainsAll;
exports.arrayContainsAny = arrayContainsAny;
exports.arrayFilter = arrayFilter;
exports.arrayFirst = arrayFirst;
exports.arrayFirstN = arrayFirstN;
exports.arrayGet = arrayGet;
exports.arrayIndexOf = arrayIndexOf;
exports.arrayIndexOfAll = arrayIndexOfAll;
exports.arrayLast = arrayLast;
exports.arrayLastIndexOf = arrayLastIndexOf;
exports.arrayLastN = arrayLastN;
exports.arrayLength = arrayLength;
exports.arrayMaximum = arrayMaximum;
exports.arrayMaximumN = arrayMaximumN;
exports.arrayMinimum = arrayMinimum;
exports.arrayMinimumN = arrayMinimumN;
exports.arraySlice = arraySlice;
exports.arraySum = arraySum;
exports.arrayTransform = arrayTransform;
exports.arrayTransformWithIndex = arrayTransformWithIndex;
exports.ascending = ascending;
exports.average = average;
exports.byteLength = byteLength;
exports.ceil = ceil;
exports.charLength = charLength;
exports.coalesce = coalesce;
exports.collectionId = collectionId;
exports.concat = concat;
exports.conditional = conditional;
exports.constant = constant;
exports.cosineDistance = cosineDistance;
exports.count = count;
exports.countAll = countAll;
exports.countDistinct = countDistinct;
exports.countIf = countIf;
exports.currentDocument = currentDocument;
exports.currentTimestamp = currentTimestamp;
exports.descending = descending;
exports.divide = divide;
exports.documentId = documentId;
exports.documentMatches = documentMatches;
exports.dotProduct = dotProduct;
exports.endsWith = endsWith;
exports.equal = equal;
exports.equalAny = equalAny;
exports.euclideanDistance = euclideanDistance;
exports.execute = execute;
exports.exists = exists;
exports.exp = exp;
exports.field = field;
exports.first = first;
exports.floor = floor;
exports.geoDistance = geoDistance;
exports.greaterThan = greaterThan;
exports.greaterThanOrEqual = greaterThanOrEqual;
exports.ifAbsent = ifAbsent;
exports.ifError = ifError;
exports.ifNull = ifNull;
exports.isAbsent = isAbsent;
exports.isError = isError;
exports.isType = isType;
exports.join = join;
exports.last = last;
exports.length = length;
exports.lessThan = lessThan;
exports.lessThanOrEqual = lessThanOrEqual;
exports.like = like;
exports.ln = ln;
exports.log = log;
exports.log10 = log10;
exports.logicalMaximum = logicalMaximum;
exports.logicalMinimum = logicalMinimum;
exports.ltrim = ltrim;
exports.map = map;
exports.mapEntries = mapEntries;
exports.mapGet = mapGet;
exports.mapKeys = mapKeys;
exports.mapMerge = mapMerge;
exports.mapRemove = mapRemove;
exports.mapSet = mapSet;
exports.mapValues = mapValues;
exports.maximum = maximum;
exports.minimum = minimum;
exports.mod = mod;
exports.multiply = multiply;
exports.nor = nor;
exports.not = not;
exports.notEqual = notEqual;
exports.notEqualAny = notEqualAny;
exports.or = or;
exports.parent = parent;
exports.pipelineResultEqual = pipelineResultEqual;
exports.pow = pow;
exports.rand = rand;
exports.regexContains = regexContains;
exports.regexFind = regexFind;
exports.regexFindAll = regexFindAll;
exports.regexMatch = regexMatch;
exports.reverse = reverse;
exports.round = round;
exports.rtrim = rtrim;
exports.score = score;
exports.split = split;
exports.sqrt = sqrt;
exports.startsWith = startsWith;
exports.stringConcat = stringConcat;
exports.stringContains = stringContains;
exports.stringIndexOf = stringIndexOf;
exports.stringRepeat = stringRepeat;
exports.stringReplaceAll = stringReplaceAll;
exports.stringReplaceOne = stringReplaceOne;
exports.stringReverse = stringReverse;
exports.subcollection = subcollection;
exports.substring = substring;
exports.subtract = subtract;
exports.sum = sum;
exports.switchOn = switchOn;
exports.timestampAdd = timestampAdd;
exports.timestampDiff = timestampDiff;
exports.timestampExtract = timestampExtract;
exports.timestampSubtract = timestampSubtract;
exports.timestampToUnixMicros = timestampToUnixMicros;
exports.timestampToUnixMillis = timestampToUnixMillis;
exports.timestampToUnixSeconds = timestampToUnixSeconds;
exports.timestampTruncate = timestampTruncate;
exports.toLower = toLower;
exports.toUpper = toUpper;
exports.trim = trim;
exports.trunc = trunc;
exports.type = type;
exports.unixMicrosToTimestamp = unixMicrosToTimestamp;
exports.unixMillisToTimestamp = unixMillisToTimestamp;
exports.unixSecondsToTimestamp = unixSecondsToTimestamp;
exports.variable = variable;
exports.vectorLength = vectorLength;
exports.xor = xor;
//# sourceMappingURL=pipelines.node.cjs.js.map
