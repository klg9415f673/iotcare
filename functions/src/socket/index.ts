import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import { getInFirestoreTree, createInFirestoreTree, updateInFirestoreTree, deleteInFirestoreTree } from './firestoreService';
import { Account, Message, Patient, Floor, Device, MobileDevice, Target, Petacom, Location, People } from '../model/UTLmodel';
import { createUTLRsaDevice, sendCommandToUTLDevice } from './../iot/iotService';
import { controlDevice } from './../iot';
import { iconUrl } from './../petacom/icon'

const database = admin.firestore()

const auth = admin.auth();
const corsHandler = cors({ origin: true, allowedHeaders: ['Content-Type', 'Authorization'] });

const getCSTTimestamp = () => {
    const date = admin.firestore.Timestamp.now().toDate();
    date.setHours(date.getHours() + 8);
    return date.toISOString();
}

const updateAllow = (account: Account) => {
    if (account.role === 'manager') {
        return true;
    } else {
        return false;
    }
}

const createAllow = (account: Account) => {
    if (account.role === 'manager') {
        return true;
    } else {
        return false;
    }
}

const updateDeviceAllow = (account: Account) => {
    if (account.role === 'manager') {
        return true;
    } else {
        return false;
    }
}

const deleteAllow = (account: Account) => {
    if (account.role === 'manager') {
        return true;
    } else {
        return false;
    }
}

const deleteDeviceAllow = (account: Account) => {
    if (account.role === 'manager') {
        return true;
    } else {
        return false;
    }
}

const getAccountByIdToken = async (req: functions.Request, res: functions.Response): Promise<Account> => {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    if (idToken === "UTL") return null;
    const target = { target: "personal-account" } as Target;
    let account: Account;
    const bearerFirebaseID = {
        firebaseID: await auth.verifyIdToken(idToken).then(decodedIdToken => { return decodedIdToken.uid })
    }

    await getInFirestoreTree(bearerFirebaseID, target).then(result => {
        if (result.status === 200) {
            account = result.data.account;
        } else {
            res.status(403).end();
        }
    }).catch(error => {
        res.status(401).send(error)})
    return account;
}

const updateAccount = (account: Account, req: functions.Request, res: functions.Response) => {
    if (updateAllow(account)) {
        const newAccount = req.body.updateAccount as Account;
        const target = { target: req.body.target } as Target;
        const payload = { newAccount };

        updateInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const followAccount = (account: Account, req: functions.Request, res: functions.Response) => {
    if (updateAllow(account)) {
        const followAccountID = req.body.followAccount as string;

    }
}

const deleteAccount = (account: Account, req: functions.Request, res: functions.Response) => {
    const target = { target: req.body.target } as Target;
    if (account.role === "manager") {
        const deletedAccount = req.body.account as Account;
        const payload = { deletedAccount };

        auth.deleteUser(deletedAccount.firebaseID).then(() => {
            deleteInFirestoreTree(payload, target)
                .then(() => res.status(200).send({ message: "OK"}))
                .catch(error => res.status(417).send(error));
        }).catch(error => res.status(417).send(error));

    } else res.status(403).end();
}

const createMessage = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    if (createAllow(account)) {
        const message = req.body.message as Message;
        // message.who.from = account.firebaseID;
        // message.requestArrivedTime = requestTimestamp;
        const target = { target: req.body.target } as Target;
        // const payload = { account, message };
        // if (message.title === 'speech') sendCommandToUTLDevice(`UTLb827eb28cf5b`, `UTL${account.firebaseID}`, 'utliot-3a89b', 'asia-east1', message.title + message.payload);
        
        const payload = {
            notification: {
                title: `${account.name}`,
                body: `${message.payload}`
            } as admin.messaging.Notification
        }
        admin.messaging().sendToDevice('e9leB7Iz61M:APA91bEe3WgONnI2zL47gdKHnmHTBKwVEf0vMJyg6-ubp_GfVC3rgZfyd8vqOtzf4E23jbuK69TZp-cFl6EbDrAIAMPk-z_d0IyqmbP1qJlRhLK7izGoXVdX1mdurq8yaW8Mgbm-q1hq', payload).then((response) => {
            res.status(200).send({ message: response});
        }).catch(error => res.status(417).send(error));

        // createInFirestoreTree(payload, target)
        //     .then(() => res.status(200).send({ message: "OK"}))
        //     .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const createEmptyPeople = (account: Account, req: functions.Request, res: functions.Response) => {
    if (createAllow(account)) {
        const people = req.body.people as People;
        const target = { target: req.body.target } as Target;
        const payload = { firebaseID: account.firebaseID, people };

        createInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK" }))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const createMobileDevice = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    const mobileDevice = req.body.mobileDevice as MobileDevice;
    mobileDevice.requestArrivedTime = requestTimestamp;
    mobileDevice.timestamp = requestTimestamp;
    const target = { target: req.body.target } as Target;
    const payload = { account, mobileDevice };

    createInFirestoreTree(payload, target)
        .then(() => res.status(200).send({ message: "OK"}))
        .catch(error => res.status(417).send(error));
}

const createLocation = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    if (createAllow(account)) {
        console.log('location', req.body.location, 'account', account)
        const location = req.body.location as Location;
        location.requestArrivedTime = requestTimestamp;
        location.timestamp = requestTimestamp
        const target = { target: req.body.target } as Target;
        const payload = { account, location };
    
        createInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error))
    } else res.status(403).end();
}

const updateLocation = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    if (updateAllow(account)) {
        const target = { target: req.body.target } as Target;
        const locationID = req.body.locationID as string;
        const location = req.body.location as Location;
        location.timestamp = requestTimestamp;
        const payload = { account, locationID, location };

        updateInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const deleteLocation = (account: Account, req: functions.Request, res: functions.Response) => {
    const target = { target: req.body.target } as Target;
    if (deleteAllow(account)) {
        const payload = {
            locationID: req.body.locationID as string,
            account: account
        }
        
        deleteInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const createfloor = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    const locationID = req.body.locationID as string;
    const floor = req.body.floor as Floor;
    floor.requestArrivedTime = requestTimestamp;
    floor.timestamp = requestTimestamp;
    const target = { target: req.body.target } as Target;
    const payload = { account, locationID, floor };

    createInFirestoreTree(payload, target)
        .then(() => res.status(200).send({ message: "OK"}))
        .catch(error => res.status(417).send(error));
}

const updatefloor = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    if (updateAllow(account)) {
        const target = { target: req.body.target } as Target;
        const locationID = req.body.locationID as string;
        const floor = req.body.floor as Floor;
        floor.timestamp = requestTimestamp;
        const payload = { account, locationID, floor };

        updateInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const deletefloor = (account: Account, req: functions.Request, res: functions.Response) => {
    const target = { target: req.body.target } as Target;
    if (deleteAllow(account)) {
        const payload = {
            locationID: req.body.locationID as string,
            floorID: req.body.floorID as string,
            account: account
        }

        deleteInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const createDevice = (account: Account, req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    if (createAllow(account)) {
        const device = req.body.device as Device;
        //console.log("裝置狀態非離線");res.status(417).send('not allowed'); 
   
        device.icon = iconUrl(device.type, device.status);
        device.requestArrivedTime = requestTimestamp;
        const target = { target: req.body.target } as Target;
        const payload = { device };
        
        createInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => {   
                console.log(error)
                res.status(417).send(error)}
                    );
    
    
    } else res.status(403).end();
}

const updateDevice = (account: Account, req: functions.Request, res: functions.Response) => {
    if (updateDeviceAllow(account)) {
        const target = { target: req.body.target } as Target;
        const device = req.body.device as Device;
        const payload = { device };

        updateInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const deleteDevice = (account: Account, req: functions.Request, res: functions.Response) => {
    const target = { target: 'device' } as Target;
    if (deleteDeviceAllow(account)) {
        const payload = {
            locationID: req.body.locationID as string,
            floorID: req.body.floorID as string,
            deviceID: req.body.deviceID as string,
            account: account
        }
        deleteInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    }
}

const deleteTag = (account: Account, req: functions.Request, res: functions.Response) => {
    const target = { target: 'tag' } as Target;
    if (deleteDeviceAllow(account)) {
        const payload = {
            tagID: req.body.tagID,
            account: account
        }

        deleteInFirestoreTree(payload, target)
            .then(() => res.status(200).send({ message: "OK"}))
            .catch(error => res.status(417).send(error));
    } else res.status(403).end();
}

const controlDevices = (account: Account, req: functions.Request, res: functions.Response) => {
    if (updateDeviceAllow(account)) {
        const device = req.body.device as Device;
        const command = '測試警報';
        controlDevice(account, command, device);
        res.status(200).send('success');
    } else {
        res.status(403).end();
    }
}

const createRsaDevice = (req: functions.Request, res: functions.Response) => {
    const body = req.body;
    const publicKey = body.publicKey;
    const deviceID = body.deviceID;
    const registryID = body.registryID;
    createUTLRsaDevice(deviceID, registryID, 'utliot-3a89b', 'asia-east1', publicKey);
    console.log('create rsa device', body)
    res.status(200).end();
}

const testNotification = (account: Account, req: functions.Request, res: functions.Response) => {
    const mobileDevice = req.body.mobileDevice as MobileDevice;
    console.log(mobileDevice)
    const payload = {
        notification: {
            title: '測試推播功能',
            body: `${account.name} 您好, 設備: '${mobileDevice.mobileName}' 推播功能正常`
        } as admin.messaging.Notification
    }
    admin.messaging().sendToDevice(mobileDevice.token, payload).then((response) => {
        res.status(200).send({ message: response});
    }).catch(error => res.status(417).send(error));
}

const createInFirestore = async (req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    const account = await getAccountByIdToken(req, res);
    const target = req.body.target as string;
    switch (target) {
        case "message":
            createMessage(account, req, res, requestTimestamp);
            break;

        case "mobile-device":
            createMobileDevice(account, req, res, requestTimestamp);
            break;

        case "people":
            createEmptyPeople(account, req, res);
            break;

        case "location":
            createLocation(account, req, res, requestTimestamp);
            break;

        case "floor":
            createfloor(account, req, res, requestTimestamp);
            break;

        case "device":
            createDevice(account, req, res, requestTimestamp);
            break;

        // for user download
        case "controlDevices":
            controlDevices(account, req, res);
            break;

        case "createRsaDevice":
            createRsaDevice(req, res);
            break;

        case "testNotification":
            testNotification(account, req, res);
            break;

        default:
            res.status(400).end();
            break;
    }
}

const updateInFirestore = async (req: functions.Request, res: functions.Response, requestTimestamp: string) => {
    const account = await getAccountByIdToken(req, res);
    const target = req.body.target as string;
    switch (target) {
        case "account":
            updateAccount(account, req, res);
            break;

        case "follow":
            followAccount(account, req, res);
            break;

        case "location":
            updateLocation(account, req, res, requestTimestamp);
            break;

        case "floor":
            updatefloor(account, req, res, requestTimestamp);
            break;

        case "device":
            updateDevice(account, req, res);
            break;

        default:
            res.status(400).end();
            break;
    }
}

const deleteInFirestore = async (req: functions.Request, res: functions.Response) => {
    const account = await getAccountByIdToken(req, res);
    const target = req.body.target as string;
    console.log("delete",target)
    switch (target) {
        case "account":
            // soon
            deleteAccount(account, req, res);
            break;

        case "location":
            deleteLocation(account, req, res);
            break;

        case "floor":
            deletefloor(account, req, res);
            break;

        case "device":
            deleteDevice(account, req, res);
            break;

        case "tag":
            deleteTag(account, req, res);
            break;

        default:
            res.status(400).end();
            break;
    }
}

export const socket = functions.runWith({ memory: '2GB' }).https.onRequest((req, res) => {
    console.log("socket")
    const requestTimestamp = getCSTTimestamp();
    corsHandler(req, res, () => {
        switch (req.method) {
            case "POST":
                createInFirestore(req, res, requestTimestamp).then(result => console.log('Success', result)).catch(error => console.log('error', error));
                break;

            case "PATCH":
                updateInFirestore(req, res, requestTimestamp).then(result => console.log('Success', result)).catch(error => console.log('error', error));
                break;

            case "DELETE":
                deleteInFirestore(req, res).then(result => console.log('Success', result)).catch(error => console.log('error', error));
                break;

            default:
                res.status(405).end();
                break;
        }
    })
})

export const hello = functions.https.onRequest((req, res) => {
    const token = req.headers.authorization.split('Bearer ')[1];
    const body = req.body;
    console.log('token', token);
    console.log('body', body);
    res.status(200).end();
})


export const updateAllDate = functions.https.onRequest((req: functions.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {

        const update_data = {
            physiological: {
                HR: 0,
                HRV: 0,
                OBLA: 0,
                SpO2: 0,
                weight: 0
            }
        }

        database.collection("personal-accounts").doc("ui9nr5vUoQPnQuPZj6sou7fSial2").collection("peoples").get().then(snapshot => {
            for (const index of snapshot.docs) {
                console.log(index.data().tagMAC)
                database.collection("personal-accounts").doc("ui9nr5vUoQPnQuPZj6sou7fSial2").collection("peoples").doc(index.data().tagMAC).set(update_data, { merge: true })
            }
        })
        res.status(200).send("OK")
    })
})
