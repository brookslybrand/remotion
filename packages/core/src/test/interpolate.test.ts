import {Easing} from '../easing';
import {interpolate} from '../interpolate';
import {expectToThrow} from './expect-to-throw';

test('Basic interpolations', () => {
	expect(interpolate(1, [0, 1], [0, 2])).toEqual(2);
	expect(interpolate(Math.PI, [0, 1, 4, 9], [0, 2, 1000, -1000])).toEqual(
		714.4364894275378
	);
	expect(interpolate(Infinity, [0, 1], [0, 2])).toEqual(Infinity);
	expect(interpolate(Infinity, [0, 1], [1, 0])).toEqual(-Infinity);
});

test('Must be the same length', () => {
	expectToThrow(() => {
		interpolate(1, [0, 2], [0, 1, 2]);
	}, /inputRange \(2\) and outputRange \(3\) must have the same length/);
});

test('Must pass at least 2 elements for input range', () => {
	expectToThrow(() => {
		interpolate(1, [0], [9]);
	}, /inputRange must have at least 2 elements/);
});

test('Input range must be strictly monotonically non-decreasing', () => {
	expectToThrow(() => {
		interpolate(1, [0, 1, 0.5], [0, 2, 0.2]);
	}, /inputRange must be strictly monotonically non-decreasing/);
	expectToThrow(() => {
		interpolate(0.75, [0, 1, 1], [0, 2, 0]);
	}, /inputRange must be strictly monotonically non-decreasing/);
});

test('Output range can be non-monotonic', () => {
	expect(interpolate(0.75, [0, 0.5, 1], [0, 2, 0])).toEqual(1);
});

test('Output range monotonically decreasing', () => {
	expect(interpolate(0.75, [0, 0.5, 1], [0, 2, 2])).toEqual(2);
});

test('Cannot have Infinity in input range', () => {
	expectToThrow(() => {
		interpolate(1, [-Infinity, 0], [0, 2]);
	}, /inputRange must contain only finite numbers, but got \[-Infinity,0\]/);
});

test('Cannot have Infinity in output Range', () => {
	expectToThrow(
		() => interpolate(1, [0, 1], [Infinity, 2]),
		/outputRange must contain only finite numbers, but got \[Infinity,2\]/
	);
});

test('Should throw if passing 2x infinity input range', () => {
	expectToThrow(
		() => interpolate(1, [Infinity, Infinity], [0, 2]),
		/inputRange must contain only finite numbers, but got \[Infinity,Infinity\]/
	);
});

test('Should throw if passing 2x infinity output range', () => {
	expectToThrow(
		() => interpolate(1, [0, 1], [-Infinity, Infinity]),
		/outputRange must contain only finite numbers, but got \[-Infinity,Infinity\]/
	);
});

test('Should throw on Infinity as third argument', () => {
	expectToThrow(
		() => interpolate(1, [0, 1, Infinity], [0, 2, 3]),
		/inputRange must contain only finite numbers, but got \[0,1,Infinity\]/
	);
});

test('Should throw on Infinity as third argument', () => {
	expectToThrow(
		() => interpolate(1, [0, 1, Infinity], [0, 2, 3]),
		/inputRange must contain only finite numbers, but got \[0,1,Infinity\]/
	);
});

test('Easing test', () => {
	expect(
		interpolate(0.5, [0, 1], [0, 1], {
			easing: Easing.sin,
		})
	).toEqual(1 - Math.cos((0.5 * Math.PI) / 2));
});

test('Extrapolation left test', () => {
	expect(
		interpolate(-3, [0, 1, 2], [0, 0.5, 1], {
			extrapolateRight: 'extend',
		})
	).toEqual(-1.5);
	expect(interpolate(-3, [0, 1, 2], [0, 0.5, 1])).toEqual(-1.5);
});

test('Extrapolation right test', () => {
	expect(
		interpolate(3, [0, 1, 2], [0, 0.5, 1], {
			extrapolateRight: 'extend',
		})
	).toEqual(1.5);
	expect(interpolate(3, [0, 1, 2], [0, 0.5, 1])).toEqual(1.5);
});

test('Extrapolation identity', () => {
	expect(
		interpolate(1000, [0, 1, 2], [0, 2, 4], {
			extrapolateRight: 'identity',
		})
	).toBe(1000);
	expect(
		interpolate(-1000, [0, 1, 2], [0, 2, 4], {
			extrapolateLeft: 'identity',
		})
	).toBe(-1000);
});

test('Clamp right test', () => {
	expect(
		interpolate(2000, [0, 1, 1000], [0, 1, -1000], {
			extrapolateRight: 'clamp',
		})
	).toEqual(-1000);
});

test('Clamp left test', () => {
	expect(
		interpolate(-2000, [0, 1, 1000], [Math.PI, 1, -1000], {
			extrapolateLeft: 'clamp',
		})
	).toEqual(Math.PI);
});

test('Zig-zag test', () => {
	expect(interpolate(3.5, [1, 2, 3, 4, 5], [0, 1000, 0, -1000, 1000])).toBe(
		-500
	);
	expect(interpolate(4, [1, 2, 3, 4, 5], [0, 1000, 0, -1000, 1000])).toBe(
		-1000
	);
	expect(interpolate(6, [1, 2, 3, 4, 5], [0, 1000, 0, -1000, 1000])).toBe(3000);
	expect(interpolate(-0.1, [1, 2, 3, 4, 5], [0, 1000, 0, -1000, 1000])).toBe(
		-1100
	);
});

test('Handle bad types', () => {
	// @ts-expect-error
	expect(() => interpolate()).toThrowError(
		/input or inputRange or outputRange can not be undefined/
	);
	// @ts-expect-error
	expect(() => interpolate(1)).toThrowError(
		/input or inputRange or outputRange can not be undefined/
	);
	// @ts-expect-error
	expect(() => interpolate('1', [0, 1], [1, 0])).toThrowError(
		/Cannot interpolation an input which is not a number/
	);
	// @ts-expect-error
	expect(() => interpolate(1, 'string', 'string')).toThrowError(
		/inputRange must contain only numbers/
	);
	// @ts-expect-error
	expect(() => interpolate(1, [1, 2, 3], 'str')).toThrowError(
		/outputRange must contain only numbers/
	);
	// @ts-expect-error
	expect(() => interpolate(1, undefined, 'string')).toThrowError(
		/input or inputRange or outputRange can not be undefined/
	);
	// @ts-expect-error
	expect(() => interpolate([1, 2], undefined, 'string')).toThrowError(
		/input or inputRange or outputRange can not be undefined/
	);
});
