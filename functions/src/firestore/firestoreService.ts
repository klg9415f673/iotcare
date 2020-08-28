import * as admin from 'firebase-admin';
import { Account, Message, MobileDevice, Floor, Device, DeviceRecord, Patient, Target, Location, People, PeopleRecord } from './../model/UTLmodel';

const database = admin.firestore();
const accountCollection = database.collection('personal-accounts');
const locationCollection = 'locations';
const floorCollection = 'floors';
const deviceCollection = 'devices';
const deviceRecordCollection = 'device-records'
const messageCollection = 'messages';
const peopleCollection = 'peoples';
const mobileCollection = 'mobile-devices';
const tagCollection = 'mobile-tags';
const tagRecordCollection = 'tag-records'



const deleteQueryBatch = (firestore: FirebaseFirestore.Firestore, query, batchSize, resolve, reject) => {
    query.get().then(snapshot => {

        // When there are no documents, done!
        if (snapshot.size === 0) {
            return 0;
        }

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        })

        return batch.commit().then(() => {
            return snapshot.size;
        });
    }).then(numDeleted => {
        if (numDeleted === 0) {
            resolve();
            return;
        }

        process.nextTick(() => {
            deleteQueryBatch(firestore, query, batchSize, resolve, reject);
        })
    }).catch(reject);
}


const deleteCollection = (firestore: FirebaseFirestore.Firestore, collectionRef, batchSize) => {
    const query = collectionRef.orderBy("timestamp", "desc").limit(batchSize);
    return new Promise((resolve, reject) => {
        deleteQueryBatch(firestore, query, batchSize, resolve, reject);
    });
}

export const getDevices = async (account: Account, locationID: string, floorID: string) => {
    const deviceSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).doc(floorID)
        .collection(deviceCollection).get();
    const devices = [];
    deviceSnapshot.forEach(deviceDoc => { devices.push(deviceDoc.data()) });
    return await devices;
}

export const deleteDeviceRecords = (device: Device) => {
    const recordCollection = accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address)
        .collection(deviceRecordCollection);

    deleteCollection(database, recordCollection, 500)
        .then(result => console.log('Delete record success.', result))
        .catch(error => console.log('Delete record error', error));
}

export const deleteDevice = (device: Device) => {
    const deviceDocument = accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address);

    deleteDeviceRecords(device);
    deviceDocument.delete().catch(error => console.log(error));
}

const getAccounts = async (): Promise<Array<Account>> => {
    const accounts = []
    const accountSnapshot = await accountCollection.get();
    accountSnapshot.forEach(accountDoc => { accounts.push(accountDoc.data()) });
    return await accounts;
}

/********************* Message *********************/

export const createMessage = async (account: Account, message: Message) => {
    account.messageNumber = account.messageNumber + 1;
    await accountCollection.doc(account.firebaseID).collection(messageCollection).add(message);
    await accountCollection.doc(account.firebaseID).update(account);
}

export const getMessages = async (account: Account, quantity: number) => {
    const messageSnapshot = await accountCollection.doc(account.firebaseID).collection(messageCollection).orderBy('requestArrivedTime', 'desc').limit(quantity).get();
    const messages = [];
    messageSnapshot.forEach(messageDoc => { messages.push(messageDoc.data()); });
    return await messages;
}

export const deleteMessages = (account: Account) => {
    const messageRecordCollection = accountCollection.doc(account.firebaseID).collection(messageCollection);
    deleteCollection(database, messageRecordCollection, 500).then(result => console.log('Success', result)).catch(error => console.log('error', error));
}

/********************* People *********************/

export const getPeople = async (firebaseID: string, tagID: string) => {
    const peopleSnapshot = await accountCollection.doc(firebaseID)
        .collection(peopleCollection).doc(tagID).get();

    return await peopleSnapshot.exists ? peopleSnapshot.data() : { error: 'people not found.' };
}

const getPeoples = async (firebaseID: string) => {
    const peopleSnapshot = await accountCollection.doc(firebaseID).collection(peopleCollection).get();
    const peoples = [];
    peopleSnapshot.forEach(peopleDoc => { peoples.push(peopleDoc.data()); });
    return await peoples;
}

export const updatePeople = async (firebaseID: string, people: People) => {
    await accountCollection.doc(firebaseID).collection(peopleCollection).doc(people.tagMAC).update(people);
}

export const createPeople = async (firebaseID: string, people: People) => {
    await accountCollection.doc(firebaseID).collection(peopleCollection).doc(people.tagMAC).set(people, { merge: true });
}

const createPeopleReport = async (firebaseID: string, people: People) => {
    await accountCollection.doc(firebaseID).collection(peopleCollection).doc(people.tagMAC)
        .collection('people-reports').add(people);
}

/********************* Mobile Device *********************/

export const createMobileDevice = async (account: Account, mobileDevice: MobileDevice) => {
    const mobileDeviceSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(mobileCollection).where('mobileName', '==', mobileDevice.mobileName).get();
    if (mobileDeviceSnapshot.empty) {
        await accountCollection.doc(account.firebaseID)
            .collection(mobileCollection).add(mobileDevice);
    }
}

export const getMobileDevices = async (account: Account) => {
    const mobileDevoceSnapshot = await accountCollection.doc(account.firebaseID).collection(messageCollection).get();
    const mobileDevices = [];
    mobileDevoceSnapshot.forEach(mobileDoc => { mobileDevices.push(mobileDoc.data() as MobileDevice) });
    return await mobileDevices;
}

export const updateMobileDevice = async (account: Account, mobileDevice: MobileDevice) => {
    const mobileDeviceSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(mobileCollection).where('mobileName', '==', mobileDevice.mobileName).get();
    if (mobileDeviceSnapshot.size === 1) {
        mobileDeviceSnapshot.forEach(mobileDoc => {
            accountCollection.doc(account.firebaseID)
                .collection(mobileCollection).doc(mobileDoc.id).update(mobileDevice)
                .catch(error => console.log('update device error', error));
        })
    }
}

export const deleteMobileDevices = (account: Account) => {
    const mobileDeviceCollection = accountCollection.doc(account.firebaseID)
        .collection(mobileCollection);
    deleteCollection(database, mobileDeviceCollection, 500).then(result => console.log('Success', result)).catch(error => console.log('error', error));
}


/********************* Floor *********************/

export const createFloor = async (account: Account, locationID: string, floor: Floor) => {
    const floorSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).where('floor', '==', floor.floor).get();
    if (floorSnapshot.empty) {
        await accountCollection.doc(account.firebaseID)
            .collection(locationCollection).doc(locationID)
            .collection(floorCollection).add(floor);
    } else { console.log('floor document is not empty') }
}

export const getFloors = async (account: Account, locationID: string) => {
    const floorSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).get();
    const floors = [];
    floorSnapshot.forEach(floorDoc => { floors.push(floorDoc.data()) });
    return await floors;
}

const getFloorsID = async (account: Account, locationID: string): Promise<Array<string>> => {
    const floorSnapshot = await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).get();
    const floorsID = [];
    floorSnapshot.forEach(floorDoc => { floorsID.push(floorDoc.id) });
    return await floorsID;
}

export const getFloor = async (account: Account, locationID: string, floorID: string) => {
    return await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).doc(floorID).get();
}

export const updateFloor = async (firebaseID: string, locationID: string, floor: Floor) => {
    const floorSnapshot = await accountCollection.doc(firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).where('floor', '==', floor.floor).get();

    await accountCollection.doc(firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).doc(floorSnapshot.docs[0].id).update(floor);
}

export const deleteFloor = async (account: Account, locationID: string, floorID: string) => {
    await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID)
        .collection(floorCollection).doc(floorID).delete();

    const devices = await getDevices(account, locationID, floorID);
    devices.forEach(device => { deleteDevice(device) })
}

const getFloorsPath = async (locationsPath: Array<string>): Promise<Array<string>> => {
    const floors: Array<string> = [];
    while (locationsPath.length) {
        const currentLocationPath = locationsPath.pop().split('/');
        const floorSnapshot = await accountCollection.doc(currentLocationPath[1])
            .collection(locationCollection).doc(currentLocationPath[3])
            .collection(floorCollection).get();

        floorSnapshot.forEach(floorDoc => { floors.push(floorDoc.ref.path) });

    }
    return await floors;
}


/********************* Loation *********************/

export const createLocation = async (account: Account, location: Location) => {
    await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).add(location);
}

export const getLocation = async (account: Account, locationID: string) => {
    return await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID).get();
}

export const updateLocation = async (account: Account, locationID: string, location: Location) => {
    await accountCollection.doc(account.firebaseID)
        .collection(locationCollection).doc(locationID).update(location);
}

export const deleteLocation = async (account: Account, locationID: string) => {
    await accountCollection.doc(account.firebaseID).collection(locationCollection).doc(locationID).delete();
    const floorsID = await getFloorsID(account, locationID);
    floorsID.forEach(floorID => {
        deleteFloor(account, locationID, floorID)
            .catch(error => console.log('delete location error', error))
    });
}

const getLocationsPath = async (accounts: Array<Account>): Promise<Array<string>> => {
    const locations: Array<string> = [];
    while (accounts.length) {
        const locationSnapshot = await accountCollection.doc(accounts.pop().firebaseID).collection(locationCollection).get();
        locationSnapshot.forEach(locationDoc => { locations.push(locationDoc.ref.path) });
    }
    return await locations;
}


/********************* Device Record *********************/

export const createDeviceRecord = async (device: Device) => {
    await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address)
        .collection(deviceRecordCollection).add(device);
}

export const getLatestDeviceRecord = async (device: Device) => {
    const deviceRecordSnapshot = await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address)
        .collection(deviceRecordCollection).orderBy('serverCreationTime', 'desc').limit(1).get();

    return await deviceRecordSnapshot.docs[0].data();
}


/********************* Tag *********************/

export const createTag = async (tag: Device) => {
    await accountCollection.doc(tag.from.firebaseID).collection(tagCollection).doc(tag.MAC_address).set(tag, { merge: true });
}

export const updateTag = async (tag: Device) => {
    await accountCollection.doc(tag.from.firebaseID).collection(tagCollection).doc(tag.MAC_address).update(tag);
}


/********************* Tag Record *********************/

export const createTagRecord = async (tag: Device) => {
    await accountCollection.doc(tag.from.firebaseID).collection(tagCollection).doc(tag.MAC_address).collection(tagRecordCollection).add(tag);
}

export const getLatestTagRecord = async (tag: Device) => {
    const tagRecordSnapshot = await accountCollection.doc(tag.from.firebaseID)
        .collection(tagCollection).doc(tag.MAC_address)
        .collection(tagRecordCollection).orderBy('timestamp', 'desc').limit(1).get();
    return tagRecordSnapshot.docs[0].data();
}

export const createTagAndRecord = async (tag: Device) => {
    await createTag(tag);
    await createTagRecord(tag);
}


/********************* Device *********************/

export const createDevice = async (device: Device) => {
    device.recordNumber = 0;
    await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address).create(device);
}

export const getDevice = async (device: Device) => {
    const deviceSnapshot = await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address).get();
    return await deviceSnapshot.exists ? deviceSnapshot.data() : { error: 'device not found' };
}

const getDevicesThroughPath = async (floorsPath: Array<string>): Promise<Array<FirebaseFirestore.DocumentData>> => {
    const devices: Array<FirebaseFirestore.DocumentData> = [];
    while (floorsPath.length) {
        const currentFloorPath = floorsPath.pop().split('/');
        const deviceSnapshot = await accountCollection.doc(currentFloorPath[1])
            .collection(locationCollection).doc(currentFloorPath[3])
            .collection(floorCollection).doc(currentFloorPath[5])
            .collection(deviceCollection).get();

        deviceSnapshot.forEach(device => { devices.push(device.data()) })
    }
    return await devices;
}

export const getRouterChildren = async (device: Device) => {
    const deviceSnapshot = await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).where('parent', '==', device.MAC_address).get();

    const devices = [];
    deviceSnapshot.forEach(deviceDoc => { devices.push(deviceDoc.data()) });

    await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address)

    return await devices;
}

export const updateDevice = async (device: Device) => {
    await accountCollection.doc(device.from.firebaseID)
        .collection(locationCollection).doc(device.from.locationID)
        .collection(floorCollection).doc(device.from.floorID)
        .collection(deviceCollection).doc(device.MAC_address).update(device);
}

export const updateDeviceAndCreateRecord = async (device: Device) => {
    await updateDevice(device);
    await createDeviceRecord(device);
}

export const getAllDevice = async () => {
    const allAccount = await getAccounts();
    const allLocationPath = await getLocationsPath(allAccount);
    const allFloorsPath = await getFloorsPath(allLocationPath);
    const allDevices = await getDevicesThroughPath(allFloorsPath)

    return await allDevices;
}

export const createAllPeopleReport = async (UTCTimestamp: string) => {
    const allAccount = await getAccounts();
    while (allAccount.length) {
        const currentAccount = allAccount.pop();
        const peoples = await getPeoples(currentAccount.firebaseID);
        while (peoples.length) {
            const currentPeople = peoples.pop() as PeopleRecord;
            currentPeople.UTCtimestamp = UTCTimestamp;
            await createPeopleReport(currentAccount.firebaseID, currentPeople);
            const people = {
                movement: 0,
                totalSitTimer: 0,
                contact: null,
                openDoorNumber: 0,
                openDrawerNumber: 0,
                WCNumber: 0,
                drinkNumber: 0,
                falldownNumber: 0,
                sittingPosition: {
                    full: 0,
                    front: 0,
                    left: 0,
                    right: 0,
                    fidget: 0
                },
                standingPosition: {
                    full: 0,
                    front: 0,
                    left: 0,
                    right: 0,
                    fidget: 0
                },
                tagMAC: currentPeople.tagMAC
            } as People

            await updatePeople(currentAccount.firebaseID, people);
        }

    }
}

/********************* Personal Account *********************/

export const createAccount = async (account: Account) => {
    delete account['iat'];
    delete account['exp'];
    await accountCollection.doc(account.firebaseID).set(account);
}

export const getAccount = async (firebaseID: string) => {
    const accountSnapshot = await accountCollection.doc(firebaseID).get();
    return await accountSnapshot.exists ? accountSnapshot.data() : { error: 'account not found' };
}

export const updateAccount = async (account: Account) => {
    await accountCollection.doc(account.firebaseID).update(account);
}

export const deleteAccount = (payload: any) => {
    const account = payload.account as Account;
    deleteMessages(account);
    deleteMobileDevices(account);
    accountCollection.doc(account.firebaseID).delete().catch(error => console.log(error));
}

/********************* Garbage Test *********************/

export const garbageTest = async (device: Device) => {
    while (device.tagMAC.length) {
        const currentTag = device.tagMAC.pop();
        const peopleSnapshot = await accountCollection.doc(device.from.firebaseID).collection('peoples').doc(currentTag).get();
        if (peopleSnapshot.exists) {
            const peopleDoc = peopleSnapshot.data() as People;
            peopleDoc.contact = device;
            peopleDoc.totalSitTimer += device.duration;
            peopleDoc.timestamp = device.timestamp;
            await accountCollection.doc(device.from.firebaseID).collection('peoples').doc(currentTag).update(peopleDoc);
            await accountCollection.doc(device.from.firebaseID).collection('peoples').doc(currentTag).collection('peopleRecords').add(peopleDoc);

        } else {
            const people = {
                tagMAC: currentTag,
                contact: device,
                totalSitTimer: device.duration,
                timestamp: device.timestamp
            } as People;

            await accountCollection.doc(device.from.firebaseID).collection('peoples').doc(currentTag).set(people);
            await accountCollection.doc(device.from.firebaseID).collection('peoples').doc(currentTag).collection('peopleRecords').add(people);
        }
    }
}
