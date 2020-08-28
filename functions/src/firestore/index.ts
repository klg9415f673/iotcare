import * as firestoreService from "./firestoreService";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as jwt from 'jsonwebtoken';
import * as cors from 'cors';
import { UTLHeaderSecret, UTLBodySecret } from './firestoreConfig';
import { Account, Message, MobileDevice, Floor, Device, DeviceRecord, Patient, Target, Location, People } from './../model/UTLmodel';

const fieldValue = admin.firestore.FieldValue;
const corsHandler = cors({ origin: true, allowedHeaders: 'Authorization' });

const headerVerify = (req: functions.Request, res: functions.Response) => {
    const token = req.headers.authorization.split("UTL ")[1];
    let target: Object;
    jwt.verify(token, UTLHeaderSecret, { algorithms: ['HS256']}, (error, decoded) => {
        if (!error) {
            target = decoded.valueOf();
        } else {
            res.status(403).send("Unauthorized");
        }
    })
    return target;
}

const payloadVerify = (req: functions.Request, res: functions.Response) => {
    let token: string;
    if (req.method === 'GET' || req.method === 'DELETE') token = req.query.bodyToken as string;
    else token = req.body.bodyToken as string;

    let payload: Object;

    jwt.verify(token, UTLBodySecret, { algorithms: ['HS256']}, (error, decoded) => {
        if (!error) {
            payload = decoded.valueOf();
        } else {
            res.status(403).send("Unauthorized");
        }
    })
    return payload;
}

const createInFirestore = (target: string, payload: any, res: functions.Response) => {
    switch (target) {
        case "personal-account":
            firestoreService.createAccount(payload.newAccount)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;
        
        case "message":
            firestoreService.createMessage(payload.account, payload.message)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "people":
            firestoreService.createPeople(payload.firebaseID, payload.people)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "mobile-device":
            firestoreService.createMobileDevice(payload.account, payload.mobileDevice)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "location":
            firestoreService.createLocation(payload.account, payload.location)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "floor":
            firestoreService.createFloor(payload.account, payload.locationID, payload.floor)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "device":
            firestoreService.createDevice(payload.device)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "deviceRecord":
            firestoreService.createDeviceRecord(payload.device)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "tag":
            firestoreService.createTag(payload.tag)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "tagRecord":
            firestoreService.createTagRecord(payload.tag)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "tagAndRecord":
            firestoreService.createTagAndRecord(payload.device)
                .then(() => res.status(200).send('OK'))
                .catch(error => res.status(417).send(error));;
            break;

        case "garbageTest":
            firestoreService.garbageTest(payload.device)
                .then(() => res.status(200).send('OK'))
                .catch(error => res.status(417).send(error));
            break;

        case "createAllPeopleReport":
            firestoreService.createAllPeopleReport(payload.UTCTimestamp)
                .then(() => res.status(200).send('OK'))
                .catch(error => res.status(417).send(error));
            break;

        default:
            res.status(404).end();
            break;
    }
}

const updateInFirestore = (target: string, payload: any, res: functions.Response) => {
    switch (target) {
        case "personal-account":
            firestoreService.updateAccount(payload)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "mobileDevice":
            firestoreService.updateMobileDevice(payload.account, payload.mobileDevice)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "people":
            firestoreService.updatePeople(payload.firebaseID, payload.people)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "location":
            firestoreService.updateLocation(payload.account, payload.locationID, payload.location)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "floor":
            firestoreService.updateFloor(payload.firebaseID, payload.locationID, payload.floor)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "device":
            firestoreService.updateDevice(payload.device)
                .then(() => res.status(200).end())
                .catch(error => {console.log("error",error);res.status(417).send(error)});
            break;

        case "updateDeviceAndCreateRecord":
            firestoreService.updateDeviceAndCreateRecord(payload.device)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        case "tag":
            firestoreService.updateTag(payload.tag)
                .then(() => res.status(200).end())
                .catch(error => res.status(417).send(error));
            break;

        default:
            res.status(404).end();
            break;
    }
}

const getInFirestore = async (target: string, payload: any, res: functions.Response) => {
    switch (target) {
        case "personal-account":
            firestoreService.getAccount(payload.firebaseID)
                .then(account => res.status(200).send({ account }))
                .catch(error => res.status(417).send(error));
            break;
        
        case "messages":
            firestoreService.getMessages(payload.account, payload.quantity)
                .then(messages => res.status(200).send({ messages }))
                .catch(error => res.status(417).send(error));
            break;

        case "mobileDevices":
            firestoreService.getMobileDevices(payload.account)
                .then(mobileDevices => res.status(200).send({ mobileDevices }))
                .catch(error => res.status(417).send(error));
            break;

        case "people":
            firestoreService.getPeople(payload.firebaseID, payload.tagID)
                .then((people: People) => res.status(200).send({ people: people}))
                .catch(error => res.status(417).send(error));
            break;

        case "location":
            firestoreService.getLocation(payload.account, payload.locationID)
                .then(location => res.status(200).send({ location }))
                .catch(error => res.status(417).send(error));
            break;

        case "floor":
            firestoreService.getFloor(payload.account, payload.locationID, payload.floorID)
                .then(floor => res.status(200).send({ floor }))
                .catch(error => res.status(417).send(error));
            break;

        case "device":
            firestoreService.getDevice(payload.device)
                .then((device: Device) => res.status(200).send({ device: device }))
                .catch(error => console.log('get device ', error));
            break;

        case "devices":
            firestoreService.getDevices(payload.account, payload.locationID, payload.floorID)
                .then(devices => res.status(200).send({ devices }))
                .catch(error => res.status(417).send(error));
            break;

        case "routerChildren":
            firestoreService.getRouterChildren(payload.device)
                .then((devices) => res.status(200).send({ devices }))
                .catch(error => res.status(417).send(error));
            break;

        case "latestDeviceRecord":
            firestoreService.getLatestDeviceRecord(payload.device)
                .then(deviceRecord => res.status(200).send({ deviceRecord }))
                .catch(error => res.status(417).send(error));
            break;

        case "latestTagRecord":
            firestoreService.getLatestTagRecord(payload.tag)
                .then(tagRecord => res.status(200).send({ tagRecord }))
                .catch(error => res.status(417).send(error));
            break;

        case "getAllDevice":
            await firestoreService.getAllDevice()
                .then(devices => res.status(200).send(devices))
                .catch(error => res.status(417).send(error));
            break;

        default:
            res.status(404).end();
            break;
    }
}

const deleteInFirestore = (target: string, payload: any, res: functions.Response) => {
    switch (target) {
        case "personal-account":
            firestoreService.deleteAccount(payload);
            res.status(200).send("Delete account beginning.");
            break;

        case "message":
            firestoreService.deleteMessages(payload.account);
            res.status(200).send("Delete message beginning.");
            break;

        case "mobileDevice":
            firestoreService.deleteMobileDevices(payload.account);
            res.status(200).send("Delete mobile device beginning.");
            break;

        case "location":
            firestoreService.deleteLocation(payload.account, payload.locationID)
                .then(() => res.status(200).send('Delete location beginning.'))
                .catch(error => res.status(417).send(error));
            break;

        case "floor":
            firestoreService.deleteFloor(payload.account, payload.locationID, payload.floorID)
                .then(() => res.status(200).send('OK'))
                .catch(error => res.status(417).send(error));
            break;

        case "device":
            firestoreService.deleteDevice(payload.device);
            res.status(200).send('Delete device beginning')
            break;

        case "deviceRecord":
            firestoreService.deleteDeviceRecords(payload.device);
            res.status(200).send("Delete Device Record Beginning");
            break;

        default:
            res.status(404).end();
            break;
    }
}

export const firestoreTree = functions.runWith({ memory: '2GB' }).https.onRequest((req, res) => {
    const target = headerVerify(req, res) as Target;
    const payload = payloadVerify(req, res);
    if (payload) {
        corsHandler(req, res, () => {
            switch (req.method) {
                case "POST":
                    createInFirestore(target.target, payload, res);
                    break;

                case "PATCH":
                    updateInFirestore(target.target, payload, res);
                    break;

                case "GET":
                    getInFirestore(target.target, payload, res).catch(error => console.log(error));
                    break;

                case "DELETE":
                    deleteInFirestore(target.target, payload, res);
                    break;

                default:
                    res.status(405).end();
                    break;
            }
        })
    }
})

