///<reference path="./types.d.ts" />

import express from 'express';
import logger from 'morgan';
import asyncHandler from 'express-async-handler';
import { getFlights } from "./flightradar";
import { getJSON } from "./util";

require('dotenv').config()

const app = express();

app.use(logger('tiny'));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});

const planeData = require('../plane-data.json');
const { getDistance } = require('../distance.js');


app.get('/:flightNumber',
    asyncHandler(async (req, res, next) => {
        const flightNumber = req.params.flightNumber;
        const flights = await getFlights(flightNumber);

        const pastRows = flights.filter(r => r.scheduled <= Date.now());

        const aircraftName = pastRows[0].aircraft; // TODO: check for specific day

        let aircraft = planeData[aircraftName];
        if (!aircraft) {
            const subName = aircraftName.split('-')[0];
            const aName = Object.keys(planeData).find(key => key.includes(subName));
            if (aName) {
                aircraft = planeData[aName];
            }
        }

        const fromCoords = await getCoords(pastRows[0].from);
        const toCoords = await getCoords(pastRows[0].to);

        const distance = getDistance({
            latitude: fromCoords.lat,
            longitude: fromCoords.lng,
        }, {
                latitude: toCoords.lat,
                longitude: fromCoords.lng,
            }
        );

        console.info(`Point distance [${distance}]`);

        const aircraftFuelBurn = Number(aircraft.fuelBurn.split(' ')[0].replace(/[^0-9\.]/g, ''));
        const totalFuelBurn = aircraftFuelBurn * distance;

        const passengerFuelBurn = totalFuelBurn / aircraft.seats;

        const passengerCO2 = passengerFuelBurn * 3.16;

        console.log(`PassengerCO2 [${passengerCO2}]`);

        res.send({ passengerCO2 });

    })
);


async function getCoords(place: string) {
    const res = await getJSON<any>(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(place)}&inputtype=textquery&fields=geometry&key=${process.env.GOOGLE_API_KEY}`);
    return res.candidates[0].geometry.location;
}


(async () => {
    const port = process.env.PORT || 12180;
    app.listen(port);
    console.log('Listening on port', port);
})().catch((e) => console.error(e.stack));
