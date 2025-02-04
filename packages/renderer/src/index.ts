import puppeteer from 'puppeteer-core';
import {Browser, Internals} from 'remotion';
import {
	ensureLocalBrowser,
	getLocalBrowserExecutable,
} from './get-local-browser-executable';
import {ImageFormat} from './image-format';
import {screenshot} from './puppeteer-screenshot';

async function screenshotDOMElement({
	page,
	imageFormat,
	quality,
	opts = {},
}: {
	page: puppeteer.Page;
	imageFormat: ImageFormat;
	quality: number | undefined;
	opts?: {
		path?: string;
		selector?: string;
	};
}): Promise<Buffer> {
	const path = 'path' in opts ? opts.path : null;
	const {selector} = opts;

	if (!selector) throw Error('Please provide a selector.');
	if (!path) throw Error('Please provide a path.');

	if (imageFormat === 'png') {
		await page.evaluate(() => (document.body.style.background = 'transparent'));
	}
	return screenshot(page, {
		omitBackground: imageFormat === 'png',
		path,
		type: imageFormat,
		quality,
	}) as Promise<Buffer>;
}

export const openBrowser = async (
	browser: Browser
): Promise<puppeteer.Browser> => {
	if (browser === 'firefox' && !Internals.FEATURE_FLAG_FIREFOX_SUPPORT) {
		throw new TypeError(
			'Firefox supported is not yet turned on. Stay tuned for the future.'
		);
	}
	await ensureLocalBrowser(browser);

	const executablePath = await getLocalBrowserExecutable(browser);
	const browserInstance = await puppeteer.launch({
		executablePath,
		product: browser,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			process.platform === 'linux' ? '--single-process' : null,
		].filter(Boolean) as string[],
	});
	return browserInstance;
};

export const provideScreenshot = async ({
	page,
	imageFormat,
	options,
	quality,
}: {
	page: puppeteer.Page;
	imageFormat: ImageFormat;
	quality: number | undefined;
	options: {
		frame: number;
		output: string;
	};
}): Promise<void> => {
	await page.evaluate((frame) => {
		window.remotion_setFrame(frame);
	}, options.frame);
	await page.waitForFunction('window.ready === true');

	await screenshotDOMElement({
		page,
		opts: {
			path: options.output,
			selector: '#canvas',
		},
		imageFormat,
		quality,
	});
};

export * from './ffmpeg-flags';
export * from './get-compositions';
export * from './get-concurrency';
export {ensureLocalBrowser} from './get-local-browser-executable';
export * from './render';
export * from './stitcher';
export * from './validate-ffmpeg';
