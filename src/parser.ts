///<reference path="./types.d.ts" />

import { readFileSync, writeFileSync } from 'fs';

const LB_TO_KG = 0.4535924;

async function app() {
    const data = readFileSync('./plane-mtow', 'utf8');
    const lines = data.split('\n');
    const headerFields = lines[0].split('\t');
    const rows = lines.slice(1);
    const outData = rows.reduce((acc: any, row) => {
        const vals = row.split('\t');
        const item: any = headerFields.reduce((acc, key, i) => ({ ...acc, [key]: vals[i] }), {});
        acc[`${item.Manufacturer} ${item.Model}`] = Number(item.MTOW.replace(/[^0-9\.]/g, '')) * LB_TO_KG;
        return acc;
    }, {});

    writeFileSync('./plane-mtow.json', JSON.stringify(outData, null, '\t'), 'utf8');
}


app().then(() => console.log('Done'), (err) => console.error(err));
