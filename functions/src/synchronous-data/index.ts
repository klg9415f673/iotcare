import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createInFirestoreTree, updateInFirestoreTree } from './../socket/firestoreService';
import { createUTLRegistry } from './../iot/iotService';
import { Account, Target, Floor } from './../model/UTLmodel';
import { googleapisStorage, storageDownloadUrl } from './synchronousConfig';

export const createAccount = functions.runWith({ memory: '1GB'}).auth.user().onCreate(user => {
    const target = { target: 'personal-account' } as Target;
    return admin.auth().getUser(user.uid).then(userRecord => {
        console.log(userRecord)
        const newAccount = {
            firebaseID: userRecord.uid,
            name: userRecord.displayName,
            email: userRecord.email,
            phone: userRecord.phoneNumber ? `0${userRecord.phoneNumber.substring(4)}` : null,
            secretCode: 12345678,
            messageNumber: 0,
            role: 'manager',
            serverCreationTime: userRecord.metadata.creationTime,
        } as Account
        createInFirestoreTree({ newAccount }, target).then(() => {
            createUTLRegistry(`UTL${user.uid}`, 'utliot-3a89b', 'asia-east1', 'UTL');
        }).catch(error => console.log(error));
    }).catch(error => console.log(error));
})

// object.name = firebaseID/locationID/7.jpg
export const floorImage = functions.runWith({ memory: '512MB' }).storage.object().onFinalize((object) => {
    const fileLocation = object.selfLink.split(googleapisStorage)[1];
    const imgUrl = `${storageDownloadUrl}${fileLocation}?alt=media&token=${object.metadata.firebaseStorageDownloadTokens}`;
    const name = object.name.split('/');
    const firebaseID = name[0];
    const locationID = name[1];
    const layer = name[2].split('.')[0];
    const floor = {
        imageUrl: imgUrl,
        generation: object.generation,
        serverCreationTime_UTC: object.timeCreated,
        floor: layer
    } as Floor;
    console.log('name', object.name);
    updateInFirestoreTree({ firebaseID, locationID, floor }, { target: 'floor' } as Target)
        .then(result => console.log(result.statusText))
        .catch(error => console.log(error));
    
    return 'action';
})

export const peopleReport = functions.runWith({ memory: '512MB' }).pubsub.topic('people-report').onPublish(async (message, context) => {
    const messageBodydata = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    if (messageBodydata !== 'create report') return 'False';

    await createInFirestoreTree({ UTCTimestamp: context.timestamp }, { target: 'createAllPeopleReport' } as Target);

    return 'OK'
})
