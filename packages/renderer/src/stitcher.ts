import execa from 'execa';
import fs from 'fs';
import {Codec, Internals, PixelFormat} from 'remotion';
import {DEFAULT_IMAGE_FORMAT, ImageFormat} from './image-format';
import {parseFfmpegProgress} from './parse-ffmpeg-progress';
import {validateFfmpeg} from './validate-ffmpeg';

const getCodecName = (codec: Codec): string => {
	if (codec === 'h264') {
		return 'libx264';
	}
	if (codec === 'h265') {
		return 'libx265';
	}
	if (codec === 'vp8') {
		return 'libvpx';
	}
	if (codec === 'vp9') {
		return 'libvpx-vp9';
	}
	throw new TypeError(`Cannot find FFMPEG codec for ${codec}`);
};

export const stitchFramesToVideo = async (options: {
	dir: string;
	fps: number;
	width: number;
	height: number;
	outputLocation: string;
	force: boolean;
	imageFormat?: ImageFormat;
	pixelFormat?: PixelFormat;
	codec?: Codec;
	crf?: number;
	onProgress?: (num: number) => void;
}): Promise<void> => {
	const codec = options.codec ?? Internals.DEFAULT_CODEC;
	const crf = options.crf ?? Internals.getDefaultCrfForCodec(codec);
	const imageFormat = options.imageFormat ?? DEFAULT_IMAGE_FORMAT;
	const pixelFormat = options.pixelFormat ?? Internals.DEFAULT_PIXEL_FORMAT;
	await validateFfmpeg();
	const files = await fs.promises.readdir(options.dir);
	const numbers = files
		.filter((f) => f.match(/element-([0-9]+)/))
		.map((f) => {
			return f.match(/element-([0-9]+)/)?.[1] as string;
		})
		.map((f) => Number(f));
	const biggestNumber = Math.max(...numbers);
	const smallestNumber = Math.min(...numbers);
	const numberLength = String(biggestNumber).length;

	const encoderName = getCodecName(codec);
	Internals.validateSelectedCrfAndCodecCombination(crf, codec);
	Internals.validateSelectedPixelFormatAndImageFormatCombination(
		pixelFormat,
		imageFormat
	);
	Internals.validateSelectedPixelFormatAndCodecCombination(pixelFormat, codec);

	const ffmpegArgs = [
		'-r',
		String(options.fps),
		'-f',
		'image2',
		'-s',
		`${options.width}x${options.height}`,
		'-start_number',
		String(smallestNumber),
		'-i',
		`element-%0${numberLength}d.${imageFormat}`,
		'-c:v',
		encoderName,
		'-crf',
		crf,
		'-b:v',
		'1M',
		options.force ? '-y' : null,
		'-pix_fmt',
		pixelFormat,
		// Without explicitly disabling auto-alt-ref,
		// transparent WebM generation doesn't work
		pixelFormat === 'yuva420p' ? '-auto-alt-ref' : null,
		pixelFormat === 'yuva420p' ? '0' : null,
		options.outputLocation,
	].filter(Boolean) as string[];

	const task = execa('ffmpeg', ffmpegArgs, {cwd: options.dir});

	task.stderr?.on('data', (data: Buffer) => {
		if (options.onProgress) {
			const parsed = parseFfmpegProgress(data.toString());
			if (parsed !== undefined) {
				options.onProgress(parsed);
			}
		}
	});
	await task;
};
