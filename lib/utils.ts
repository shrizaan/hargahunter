import * as cheerio from 'cheerio';
import { PriceHistoryItem, Product } from '../types';

const Notification = {
	WELCOME: 'WELCOME',
	CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
	LOWEST_PRICE: 'LOWEST_PRICE',
	THRESHOLD_MET: 'THRESHOLD_MET',
};

const THRESHOLD_PERCENTAGE = 40;


// Utils by Me
export function cheerioExtractData(response: any) {
	const $ = cheerio.load(response.data.browserHtml);
	const productName = $('#productTitle').text().trim();
}

export function extractImages(images: any) {
	const imageList = images.map((image: any) => image.url);
	return imageList;
}

export function extractCategory(category: any) {
	const selectedCategory = category.slice(1, -1);
	const categoryList = selectedCategory.map((category: any) => category.name);
	return categoryList;
}

export function moneyFormatter(price: number, currency: string) {
	const formatNumber = price.toLocaleString('id-ID', {
		style: 'currency',
		currency: currency,
	});

	if(currency === 'IDR') {
		// For example: Rp 100.000,00. I want to remove the last 3 characters.
		return formatNumber.slice(0, -3);
		
	}
	
	return  formatNumber;
}

// Extracts and returns the price from a list of possible elements.
export function extractPrice(...elements: any) {
	for (const element of elements) {
		const priceText = element.text().trim();

		if (priceText) {
			const cleanPrice = priceText.replace(/[^\d.]/g, '');

			let firstPrice;

			if (cleanPrice) {
				firstPrice = cleanPrice.match(/\d+\.\d{2}/)?.[0];
			}

			return firstPrice || cleanPrice;
		}
	}

	return '';
}

// Extracts and returns the currency symbol from an element.
export function extractCurrency(element: any) {
	const currencyText = element.text().trim().slice(0, 1);
	return currencyText ? currencyText : '';
}


export function extractDescription($: any) {
	// these are possible elements holding description of the product
	const selectors = [
		'.a-unordered-list .a-list-item',
		'.a-expander-content p',
		// Add more selectors here if needed
	];

	for (const selector of selectors) {
		const elements = $(selector);
		if (elements.length > 0) {
			const textContent = elements
				.map((_: any, element: any) => $(element).text().trim())
				.get()
				.join('\n');
			return textContent;
		}
	}

	// If no matching elements were found, return an empty string
	return '';
}

// Get Prices Function
export function getHighestPrice(priceList: PriceHistoryItem[]) {
	let highestPrice = priceList[0];

	for (let i = 0; i < priceList.length; i++) {
		if (priceList[i].price > highestPrice.price) {
			highestPrice = priceList[i];
		}
	}

	return highestPrice.price;
}

export function getLowestPrice(priceList: PriceHistoryItem[]) {
	let lowestPrice = priceList[0];

	for (let i = 0; i < priceList.length; i++) {
		if (priceList[i].price < lowestPrice.price) {
			lowestPrice = priceList[i];
		}
	}

	return lowestPrice.price;
}

export function getAveragePrice(priceList: PriceHistoryItem[]) {
	const sumOfPrices = priceList.reduce((acc, curr) => acc + curr.price, 0);
	const averagePrice = sumOfPrices / priceList.length || 0;

	return averagePrice;
}


export const getEmailNotifType = (
	scrapedProduct: Product,
	currentProduct: Product
) => {
	const lowestPrice = getLowestPrice(currentProduct.priceHistory);

	if (scrapedProduct.price < lowestPrice) {
		return Notification.LOWEST_PRICE as keyof typeof Notification;
	}
	if (!scrapedProduct.availability && currentProduct.availability) {
		return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
	}
	if (scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE) {
		return Notification.THRESHOLD_MET as keyof typeof Notification;
	}

	return null;
};
