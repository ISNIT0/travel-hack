import cheerio from 'cheerio';
import { getJSON } from './util';
import Axios from 'axios';

// const $browser = puppeteer.launch({ args: ['--no-sandbox'] });

export async function getFlights(flightNumber: string) {
    const fnRes = await getJSON<any>(`https://www.flightradar24.com/v1/search/web/find?query=${flightNumber}&limit=18&type=schedule`);
    const normalisedFlightNumber = (fnRes.results[0] || { id: flightNumber }).id;
    console.info(`Normalised from [${flightNumber}] to [${normalisedFlightNumber}]`);

    const url = `https://www.flightradar24.com/data/flights/${normalisedFlightNumber}`;

    const { data: html } = await Axios.get(url);

    // await page.goto(url);

    const $ = cheerio.load(html);

    const rows = $('#tbl-datatable .data-row').toArray()
        .map(row => {
            const [, , scheduled, from, to, aircraft, flightTime, departureTime, actualDepartureTime, arrivalTime] = $(row).find('td').toArray() as any[];

            return {
                scheduled: scheduled.attribs['data-timestamp'] * 1000,
                from: from.attribs.title.trim(),
                to: to.attribs.title.trim(),
                aircraft: ($(aircraft).find('a')[0] || { attribs: { title: $(aircraft).text() } }).attribs.title.trim(),
            };
        });

    return rows;
}

function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
