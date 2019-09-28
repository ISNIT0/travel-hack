import puppeteer from 'puppeteer';
import { getJSON } from './util';

const $browser = puppeteer.launch({ args: ['--no-sandbox'] });

export async function getFlights(flightNumber: string) {
    const browser = await $browser;
    const page = await browser.newPage();
    try {
        const fnRes = await getJSON<any>(`https://www.flightradar24.com/v1/search/web/find?query=${flightNumber}&limit=18&type=schedule`);
        const normalisedFlightNumber = (fnRes.results[0] || { id: flightNumber }).id;
        console.info(`Normalised from [${flightNumber}] to [${normalisedFlightNumber}]`);

        const url = `https://www.flightradar24.com/data/flights/${normalisedFlightNumber}`;

        await page.goto(url);

        const rows = await page.$$eval('#tbl-datatable .data-row', rows => {
            return rows.map(row => {
                const [, , scheduled, from, to, aircraft, flightTime, departureTime, actualDepartureTime, arrivalTime] = row.querySelectorAll('td') as any;
                return {
                    scheduled: scheduled.dataset.timestamp * 1000,
                    from: from.title.trim(),
                    to: to.title.trim(),
                    aircraft: (aircraft.querySelector('a') || { title: aircraft.textContent }).title.trim(),
                };
            });
        });

        return rows;

    } finally {
        page.close();
    }
}

function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
