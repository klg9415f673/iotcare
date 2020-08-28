import * as admin from 'firebase-admin';

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://utliot-3a89b.firebaseio.com"
});
admin.firestore().settings({ timestampsInSnapshots: true });


import { socket, hello, updateAllDate } from './socket';
import * as synchronous from './synchronous-data';
import * as firestore from './firestore';
import * as iot from './iot';
import * as Tag from './iot/tagService';
import * as appsocket from './APP/functions'

export const Socket = socket;
export const CreateAccount = synchronous.createAccount;
export const FloorImg = synchronous.floorImage;
export const PeopleReport = synchronous.peopleReport;
export const SmokeSchedule = iot.smokeSchedule;
export const SensorDuration = iot.sensorDuration;
// export const TagMovement = iot.tagMovement;
export const TagProcess = iot.tagProcess;
// export const TagVisible = iot.tagVisible;
export const UploadBridge = iot.uploadBridge;
export const FirestoreTree = firestore.firestoreTree;

export const tagService = Tag.tagService;




export const Hello = hello;


export const updateAlldata = updateAllDate;

export const APPsocket = appsocket.APPsocket; 
export const Savetaghistory = iot.savetaghistory
