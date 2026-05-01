import { BaseGesture, GestureRef } from '../handlers/gestures/gesture';
export type RelationPropName = 'simultaneousWithExternalGesture' | 'requireExternalGestureToFail' | 'blocksExternalGesture';
export type RelationPropType = Exclude<GestureRef, number> | Exclude<GestureRef, number>[];
export declare function applyRelationProp(gesture: BaseGesture<any>, relationPropName: RelationPropName, relationProp: RelationPropType): void;
//# sourceMappingURL=utils.d.ts.map