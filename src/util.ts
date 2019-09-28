import axios from 'axios';

export function getJSON<T>(url: string) {
    return axios.get<T>(url, { responseType: 'json' })
        .then((a) => a.data);
}