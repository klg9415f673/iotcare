import axios, { AxiosResponse } from 'axios';
import { modelServiceUrl, UTLHeaderSecret, UTLBodySecret } from './socketConfig';
import * as jwt from 'jsonwebtoken';
import { Target } from './../model/UTLmodel';

// target 放在 header, token 5 second 到期
const headerSign = (target: Object) => {
    return jwt.sign(target, UTLHeaderSecret, { algorithm: "HS256", expiresIn: 5 })
}

// token 5 second 到期
const bodySign = (payload: Object) => {
    return jwt.sign(payload, UTLBodySecret, { algorithm: "HS256", expiresIn: 5 });
}

const getHeaders = async (target) => {
    const UTLheaderToken = await headerSign(target);
    const headers = {
        "Authorization": `UTL ${UTLheaderToken}`
    };
    return headers;
}

export const createInFirestoreTree = async (payload: Object, target: Target): Promise<AxiosResponse<any>> => {
    const headers = await getHeaders(target);
    const bodyToken = await bodySign(payload);
    const result = await axios.post(modelServiceUrl, { bodyToken }, { headers });
    return result;
}

export const updateInFirestoreTree = async (payload: Object, target: Target): Promise<AxiosResponse<any>> => {
    const headers = await getHeaders(target);
    const bodyToken = await bodySign(payload);
    const result = await axios.patch(modelServiceUrl, { bodyToken }, { headers });
    return result;
}

export const getInFirestoreTree = async (payload: Object, target: Target): Promise<AxiosResponse<any>> => {
    const headers = await getHeaders(target);
    const bodyToken = await bodySign(payload);
    const result = await axios.get(modelServiceUrl + `?bodyToken=${bodyToken}`, { headers });
    console.log("getInFirestoreTree : ",result.data)
    return result;
}

export const deleteInFirestoreTree = async (payload: Object, target: Target): Promise<AxiosResponse<any>> => {
    const headers = await getHeaders(target);
    const bodyToken = await bodySign(payload);
    const result = await axios.delete(modelServiceUrl + `?bodyToken=${bodyToken}`, { headers });
    return result;
}
