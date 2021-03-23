import { clearUTLRegistry, createUTLRegistry, createUTLRsaDevice, getUTLDeviceState, sendCommandToUTLDevice, setUTLDeviceConfig, listUTLDevices } from './iotService';
import * as functions from 'firebase-functions';
import { decodePetacomFormat, decodeCushionThing, decodeTagThing, decodePosition, decodeTemperatureAndHumiditysensor, decodePhysiologicalThing } from './../petacom';
import { getInFirestoreTree, createInFirestoreTree, updateInFirestoreTree } from './../socket/firestoreService';
import { Account, Device, FireSensor, DeviceRecord, Target, Petacom, People } from './../model/UTLmodel';
import { DistVincenty } from './../algorithm';
import { iconUrl } from './../petacom/icon';

import * as admin from 'firebase-admin';
import { gamesManagement } from '../../node_modules/googleapis/build/src/apis/gamesManagement';
const database = admin.firestore()

const moment = require('moment');
const tz = require('moment-timezone');




export const uploadBridge = functions.runWith({ memory: '2GB' }).pubsub.topic('UTL').onPublish(async (message, context) => {
    
    const messageBodydata = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    console.log("messageBodydata",messageBodydata)
    console.log(messageBodydata.length)
    if (!messageBodydata) { console.log('message null'); return false };
    var DataSet = []
    switch(messageBodydata.length){

        case 600:
            console.log("BLE5.0");
            for (let i=1;i<9;i++){
                const HOP = messageBodydata.substr(480,14);
                const Router = messageBodydata.substr(494,106);
                var site = 54 * i ;
                var Combineddata = messageBodydata.substr(2,site) + HOP + Router;
                DataSet.push(Combineddata);
            }
        break;

        case 174:
            console.log("BLE4.0");
            DataSet.push(messageBodydata);
        break;

    }

    for(let i=0; i<DataSet.length; i++){

        const decodedData = await decodePetacomFormat(DataSet[i]);
        console.log('decoded data', decodedData);
        var payload
        var result
        switch(decodedData.device.petacom.events){ 
            case '人與物相遇 bTag':
                console.log('人與物相遇 bTag')
                decodedData.device.icon = iconUrl('人與物相遇 bTag', decodedData.device.petacom.status); //定位置
                await createInFirestoreTree(decodedData, { target: 'tagAndRecord' } as Target);

                payload = {
                    device: {
                        from: decodedData.device.from,
                        MAC_address: decodedData.device.petacom.deviceMac
                    }
                }
                result = await getInFirestoreTree(payload, { target: "device" } as Target) //相遇之物
                const coherenceDevice = result.data.device as Device;

                const peopleResult = await getInFirestoreTree({ firebaseID: decodedData.device.from.firebaseID, tagID: decodedData.device.MAC_address },//router的firebaseID、tag的mac
                    { target: 'people' } as Target);  // 人 (不同於 tag)
                const people = peopleResult.data.people as People;

                people.contact = coherenceDevice;
                people.timestamp = decodedData.device.timestamp;


                //根據 物 去更新 人 的資料
                switch(decodedData.device.petacom.status) {
                    case 'on':
                        var position
                        switch(coherenceDevice.type){
                            case'大門磁簧開關':
                                people.openDoorNumber++;
                            break;
                            case'抽屜磁簧開關':
                                people.openDrawerNumber++;
                            break;
                            case'坐墊':
                                if (!coherenceDevice.tagMAC) {
                                    coherenceDevice.tagMAC = []
                                }
                                if (coherenceDevice.tagMAC.indexOf(decodedData.device.MAC_address) === -1) { //把人綁進坐墊
                                    coherenceDevice['tagMAC'].push(decodedData.device.MAC_address);
                                    await updateInFirestoreTree({ device: coherenceDevice }, { target: 'device' } as Target);
                                };
                                position = decodePosition(messageBodydata)
                                switch (position) {
                                    case "左":
                                        people.sittingPosition.left++;
                                        break;
                                    case "右":
                                        people.sittingPosition.right++;
                                        break;
                                    case "前":
                                        people.sittingPosition.front++;
                                        break;
                                    case "滿":
                                        people.sittingPosition.full++;
                                        break;
                                    case "坐立不安":
                                        people.sittingPosition.fidget++;
                                        break;
                                    default:
                                        break;
                                }
                            break;
                            case'踏墊':
                                people.WCNumber++;

                                position = decodePosition(messageBodydata)
                                switch (position) {
                                    case "左":
                                        people.standingPosition.left++;
                                        break;
                                    case "右":
                                        people.standingPosition.right++;
                                        break;
                                    case "前":
                                        people.standingPosition.front++;
                                        break;
                                    case "滿":
                                        people.standingPosition.full++;
                                        break;
                                    case "坐立不安":
                                        people.standingPosition.fidget++;
                                        break;
                                    default:
                                        break;
                                }

                            break;
                            case '飲水機踏墊':
                                people.drinkNumber++;

                                position = decodePosition(messageBodydata)
                                switch (position) {
                                    case "左":
                                        people.standingPosition.left++;
                                        break;
                                    case "右":
                                        people.standingPosition.right++;
                                        break;
                                    case "前":
                                        people.standingPosition.front++;
                                        break;
                                    case "滿":
                                        people.standingPosition.full++;
                                        break;
                                    case "坐立不安":
                                        people.standingPosition.fidget++;
                                        break;
                                    default:
                                        break;
                                }
                            break;
                        }
                        break;
                    case'off':
                        console.log(coherenceDevice.type, "狀態機OFF")
                        switch(coherenceDevice.type){
                            case '坐墊':
                                if (!coherenceDevice.tagMAC) { coherenceDevice.tagMAC = [] }
                            break;
                            }
                    break;
                    default:
                        console.log("狀態機 unknow")
                    break;
                }
                await updateInFirestoreTree({ firebaseID: decodedData.device.from.firebaseID, people: people },
                    { target: 'people' } as Target);
            break;
            case '穿戴式感測器 bTag'://修改
                console.log('穿戴式感測器 bTag')
                decodedData.device.icon = iconUrl('穿戴式感測器 bTag', decodedData.device.petacom.status);
                // await createInFirestoreTree(decodedData, { target: 'tagAndRecord' } as Target);

                decodedData.device.thing = decodeTagThing(messageBodydata)
                decodedData.device.petacom.deviceMac = decodedData.device.MAC_address
            


                // if (decodedData.device.thing.noMove) {
                //     decodedData.device.icon = iconUrl('穿戴式感測器 bTag', '無移動');
                //     // await createInFirestoreTree(decodedData, { target: 'tagAndRecord' } as Target);
                // }
                switch(decodedData.device.thing.Status){
                    case "sitting":
                        var sitbegintime = {sitbegintime:Date.now() }
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .set(sitbegintime,{merge:true})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .update({timestamp:moment(Date()).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss.SSSSSS")})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                        .set(sitbegintime,{merge:true})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                        .update({timestamp:moment(Date()).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss.SSSSSS")})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .get()
                        .then(async function(doc) {
                            if(doc.data().thing.Status ==="standing"){
                                var standbegintime = doc.data().standbegintime
                                var standendtime = Date.now()
                                var Standtime = standendtime - standbegintime 
                                var timestamp = moment(standendtime).tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                                if(Standtime >= 60*60*1000 ){
                                    database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address).collection("alertreport").doc()
                                    .set({alert:"position",comment:"standing time"+ Standtime,timestamd:timestamp});
                                }
                            }
                        })
                    break;
                    case "walking":
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .get()
                        .then(async function(doc) {
                            if(doc.data().thing.Status ==="standing"){
                                var standbegintime = doc.data().standbegintime
                                var standendtime = Date.now()
                                var Standtime = standendtime - standbegintime 
                                var timestamp = moment(standendtime).tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                                if(Standtime >= 60*60*1000 ){
                                    database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address).collection("alertreport").doc()
                                    .set({alert:"position",comment:"standing time"+ Standtime,timestamd:timestamp});
                                }
                            }
                        })
                    
                    break;
                    case "falldown":
                        decodedData.device.icon = iconUrl('穿戴式感測器 bTag', 'falldown');
                        
                        // if (decodedData.device.thing.falldownStatus) {
                        //     const peopleResult = await getInFirestoreTree({ firebaseID: decodedData.device.from.firebaseID, tagID: decodedData.device.MAC_address },//router的firebaseID、tag的mac
                        //         { target: 'people' } as Target);  // 人 (不同於 tag)
                        //     const people = peopleResult.data.people as People;
                        //     people.falldownNumber++;
                        //     await updateInFirestoreTree({ firebaseID: decodedData.device.from.firebaseID, people: people }, { target: 'people' } as Target);
                        // }

                        //await createInFirestoreTree(decodedData, { target: 'tagAndRecord' } as Target);
                    break;
                    case "standing":
                        var standbegintime = {standbegintime:Date.now() }
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .set(standbegintime,{merge:true})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .update({timestamp:moment(Date()).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss.SSSSSS")})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                        .set(standbegintime,{merge:true})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                        .update({timestamp:moment(Date()).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss.SSSSSS")})
                        await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                        .get()
                        .then(async function(doc) {
                            if(doc.data().thing.Status ==="sitting"){
                                var sitbegintime = doc.data().sitbegintime
                                var sitendtime = Date.now()
                                var Sittime = sitendtime - sitbegintime 
                                var timestamp = moment(sitendtime).tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                                if(Sittime >= 60*60*1000 ){
                                    database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address).collection("alertreport").doc()
                                    .set({alert:"position",comment:"sitting time"+ Sittime,timestamd:timestamp});
                                }
                                var totalSitTime = 0 
                                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                                .get()
                                .then(function(document) {  
                                    totalSitTime = document.data().totalSitTimer 
                                    totalSitTime = totalSitTime + Sittime
                                })
                                var  totalSitTimer = {totalSitTimer:totalSitTime }
                                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                                .set(totalSitTimer,{merge:true})
                            }
                            
                        })
                    break;
                }
                //createInFirestoreTree(decodedData, { target: 'tagAndRecord' } as Target);
                // const tag = {
                //     from: decodedData.device.from,
                //     MAC_address: decodedData.device.MAC_address,20
        
                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("mobile-tags").doc(decodedData.device.MAC_address)
                .set(decodedData.device,{merge:true})
                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                .set(decodedData.device,{merge:true})
                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                .set({device:"amulet"},{merge:true})
                // var payload = { tag: tag };
                // await updateInFirestoreTree(payload, { target: 'tag' } as Target)
            //修改-
            break;
            case '可攜式感測器 bTag'://生理資訊手環
                console.log('可攜式感測器 bTag')
                const thing = messageBodydata.substr(38, 16);
                const healthydata = decodePhysiologicalThing(thing)
                // await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").where("healthyMAC", "==" , decodedData.device.MAC_address)
                // .get()
                // .then(function(querySnapshot) {
                    
                //     querySnapshot.forEach(function(doc) {
                //         database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(doc.id).update({physiological:healthydata,timestamp:decodedData.device.timestamp})
                //         });
                // })
                // .catch(function(error) {
                //     console.log("Error getting documents: ", error);
                // }); 生理資訊手環綁定護身符方案
                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                .set({device:"bracelet",physiological:healthydata},{merge:true})
                .catch(function(error) {
                    console.log("Error getting documents: ", error);}) 
                await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("peoples").doc(decodedData.device.MAC_address)
                .set(decodedData.device,{merge:true})//生理資訊手環與護身符分離
            break;
        
        
        case"人與物相遇": //固定式裝置(坐墊、踏墊、抽屜磁簧開關...)  
        
            result = await getInFirestoreTree(decodedData, { target: "device" } as Target)
            console.log("固定式裝置_GET : ", result.data)
            if (result.status !== 200) { console.log('get device fail.'); return 'fail' }

            let device = new Device;
            device = result.data.device as Device;
            device.petacom = decodedData.device.petacom;
            device.recordNumber += 1;
            device.status = decodedData.device.petacom.status;  // 為了和APP統一
            device.icon = iconUrl(device.type, device.status);
            device.timestamp = decodedData.device.timestamp;
            console.log("device :", device)

            //修改
            switch (device.type) {
                case '坐墊':
                    device.thing = await decodeCushionThing(messageBodydata)
                    break;
                case '踏墊':
                    break;
                case '抽屜磁簧開關':
                    break;
                case '大門磁簧開關':
                    break;
                case 'Router':
                    break;
                case 'Node':
                    break;
            }
            //修改-

            payload = { device: device };
            console.log("updateInFirestoreTree, target: device, payload: ", payload)
            await updateInFirestoreTree(payload, { target: "device" } as Target)
        break;
        case"溫濕度感測器":
            await database.collection("personal-accounts").doc(decodedData.device.from.firebaseID).collection("locations").doc(decodedData.device.from.locationID)
            .collection("floors").doc(decodedData.device.from.floorID).collection("devices").doc(decodedData.device.MAC_address)
            .set(decodedData.device,{merge:true})
            
        break;
        }
    }    
    return 'OK';
})
//媽的改if變switch有夠累，還要讓以前的東西可以繼續跑，操你媽，我就改一半了，固定式跟穿戴式我放棄
//結果固定式我還是改了，機掰溫溼度
export const smokeSchedule = functions.runWith({ memory: '1GB' }).pubsub.topic('smoke-schedule').onPublish(async (message, context) => {
    /*須至cloud schedule 設定 */
    const messageBodydata = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    if (messageBodydata !== 'check time') return 'False';
    const result = await getInFirestoreTree({ 'test': 'sssss' }, { target: 'getAllDevice' } as Target);
    const smoke = await result.data.filter((device: Device) => { return device.type === '煙霧感測器' });
    while (smoke.length) {
        const device = smoke.pop() as Device;
        if (+new Date() - +new Date(device.timestamp) >= 300000) {
            device.status = '離線';
            device.icon = iconUrl(device.type, '離線');
            await updateInFirestoreTree({ device }, { target: "updateDeviceAndCreateRecord" } as Target)
        }
    }
    return 'OK'
})

const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    })
}



const duration = (currentDevice: Device, previousDevice: Device): number => {
    if (previousDevice.status === 'off' && currentDevice.status === 'on') { return 0 }
    console.log("beforeTime", new Date(previousDevice.timestamp).getTime())
    console.log("afterTime:", new Date(currentDevice.timestamp).getTime())
    return new Date(currentDevice.timestamp).getTime() - new Date(previousDevice.timestamp).getTime();
}


//感測器更新
export const sensorDuration = functions.runWith({ memory: '1GB' })
    .firestore.document('personal-accounts/{accountID}/locations/{locationID}/floors/{floorID}/devices/{deviceID}')
    .onUpdate(async (change, context) => {

        const eventTimestamp_CST = new Date(context.timestamp).setHours(new Date(context.timestamp).getHours() + 8)
        const currentDevice = change.after.data() as Device;
        const previousDevice = change.before.data() as Device;
        console.log(currentDevice.deviceName, 'between', eventTimestamp_CST - new Date(currentDevice.timestamp).getTime())
        if ((eventTimestamp_CST - new Date(currentDevice.timestamp).getTime()) >= 1500) { return 'Processed Doc' }

        switch (currentDevice.type) {
            case '坐墊':
                const durTime = duration(currentDevice, previousDevice);
                console.log("durTime: ", durTime)
                if (currentDevice.tagMAC.length) {
                    currentDevice.tagMAC.forEach(async (tagMAC) => {
                        const result = await getInFirestoreTree({ firebaseID: currentDevice.from.firebaseID, tagID: tagMAC },
                            { target: 'people' } as Target);
                        const people = result.data.people as People;
                        people.totalSitTimer ? people.totalSitTimer += durTime : people.totalSitTimer = durTime;
                        await createInFirestoreTree({ firebaseID: currentDevice.from.firebaseID, people: people },
                            { target: 'people' } as Target);
                    })

                    if (currentDevice.status === 'off') {
                        while (currentDevice.tagMAC.length) {
                            const tagMAC = currentDevice.tagMAC.pop();
                            const result = await getInFirestoreTree({ firebaseID: currentDevice.from.firebaseID, tagID: tagMAC },
                                { target: 'people' } as Target);
                            const people = result.data.people as People;
                            people.contact = null;
                            await createInFirestoreTree({ firebaseID: currentDevice.from.firebaseID, people: people },
                                { target: 'people' } as Target);
                        }
                        currentDevice.tagMAC = [];
                        await updateInFirestoreTree({ device: currentDevice }, { target: 'device' } as Target);
                    } else {
                        await createInFirestoreTree({ device: currentDevice }, { target: 'deviceRecord' } as Target);
                    }
                }
                break;

            // case '大門磁簧開關':
            //     console.log('大門磁簧開關', currentDevice)
            // if (currentDevice.status === 'on') {
            //     currentDevice.duration = 0;
            // }
            // await updateInFirestoreTree({ device: currentDevice }, { target: 'device' } as Target)
            // break;

            default:
                await createInFirestoreTree({ device: currentDevice }, { target: 'deviceRecord' } as Target);
                break;
        }
        return 'OK'
    })

export const tagProcess = functions.runWith({ memory: '1GB' })
    .firestore.document('personal-accounts/{accountID}/mobile-tags/{tagID}')
    .onUpdate(async (change, context) => {

        const currentTag = change.after.data() as Device;
        const previousTag = change.before.data() as Device;
        /*
        tag更新時，如果tagVisible相同，計算移動距離，如果大於100則不計算。更新移動距離
        */
        if (currentTag.tagVisible && previousTag.tagVisible) {
            let distance = await DistVincenty(currentTag.geoPoint.latitude, currentTag.geoPoint.longitude,
                previousTag.geoPoint.latitude, previousTag.geoPoint.longitude);
            if (distance > 100) { distance = 0; };
            const result = await getInFirestoreTree({ firebaseID: currentTag.from.firebaseID, tagID: currentTag.MAC_address }, { target: 'people' } as Target);
            const people = result.data.people as People;
            people.movement += distance;
            people.movement = parseFloat(people.movement.toFixed(4))
            people.timestamp = currentTag.timestamp;
            await createInFirestoreTree({ firebaseID: currentTag.from.firebaseID, people: people }, { target: 'people' } as Target);
        }
        return 'OK'
    })



//下面這支不知道明確作用
// export const tagMovement = functions.runWith({ memory: '1GB'})
//     .firestore.document('personal-accounts/{accountID}/mobile-tags/{tagID}')
//     .onUpdate(async (snapshot, context) => {

//     const previousData = snapshot.before.data() as Device;
//     const currentData = snapshot.after.data() as Device;
//     if (currentData.timestamp === previousData.timestamp) { return 'OK' };
//     currentData.movement = DistVincenty(previousData.geoPoint.latitude,previousData.geoPoint.longitude,
//         currentData.geoPoint.latitude, currentData.geoPoint.longitude);
//     await updateInFirestoreTree({ tag: currentData }, { target: 'tag' } as Target);
//     return 'OK';
// })

//下面這支因delay16秒而取消使用
// export const tagVisible = functions.runWith({ memory: '1GB' })
//     .firestore.document('personal-accounts/{accountID}/mobile-tags/{tagID}/tag-records/{tagRecordID}')
//     .onCreate(async (snapshot, context) => {

//         const tagRecordSnapshot = snapshot.data() as Device;
//         let payload = { tag: tagRecordSnapshot };
//         await sleep(16000)
//         const result = await getInFirestoreTree(payload, { target: 'latestTagRecord' } as Target)
//         if (result.status !== 200) { return 'failed' };
//         const latestRecord = result.data.tagRecord as DeviceRecord;
//         if (tagRecordSnapshot.timestamp === latestRecord.timestamp) {
//             const tag = {
//                 from: tagRecordSnapshot.from,
//                 MAC_address: tagRecordSnapshot.MAC_address,
//                 tagVisible: false
//             } as Device
//             payload = { tag: tag };
//             await updateInFirestoreTree(payload, { target: 'tag' } as Target)
//         }
//         return await 'action';
//     })



const heightTransfer = (number: number): string => {
    let result = '';
    if (number < 10) {
        result = `0${number}`;
    } else {
        result = `${number}`;
    }
    return result;
}

const latitudeAndLongitude = (string: string) => {
    let result = string.split('.')[1].substr(2);
    if (result.length !== 4) result += '0';
    return result;
}

export const controlDevice = (account: Account, command: string, device: Device) => {
    let commandMessage: string;
    let deviceID: string;
    let registryID: string;
    if (!device.wifi_address) {
        switch (device.type) {
            case '消防感測器':
                if (command === '測試警報') {
                    const mode = '9024E6';
                    const time = '0000';
                    const thing = '0000000000000000';
                    deviceID = `UTL${device.from.routerID}`;
                    registryID = `UTC${account.firebaseID}`;
                    const height = heightTransfer(device.height);
                    const routerMessage = '00121.53124525.1234560703';
                    device.geoPoint.longitude = latitudeAndLongitude(device.geoPoint.longitude);
                    device.geoPoint.latitude = latitudeAndLongitude(device.geoPoint.longitude);
                    commandMessage = `${mode}${device.MAC_address}${time}${device.geoPoint.longitude}${device.geoPoint.latitude}07${height}${thing}${routerMessage}`;
                }
                break;

            default:
                break;
        }
    } else {
        // 按router全部測試
        getInFirestoreTree(device, { target: 'routerChildren' } as Target).then(result => {
            if (command === '測試警報' && result.status === 200) {
                const mode = '9024E6';
                const time = '0000';
                const thing = '0000000000000000';
                const height = heightTransfer(device.height);
                const routerMessage = '00124534560703';
                deviceID = `UTL${device.MAC_address}`;
                registryID = `UTL${account.firebaseID}`;
                const devices = result.data.devices as Array<Device>;
                for (const deviceDoc of devices) {
                    deviceDoc.geoPoint.longitude = latitudeAndLongitude(device.geoPoint.longitude);
                    deviceDoc.geoPoint.latitude = latitudeAndLongitude(device.geoPoint.latitude);
                    commandMessage += `${mode}${deviceDoc.MAC_address}${time}${deviceDoc.geoPoint.longitude}${deviceDoc.geoPoint.latitude}00${height}${thing}${routerMessage}`;
                }
            }
        }).catch(error => console.log(error));
    }
    sendCommandToUTLDevice(deviceID, registryID, 'utliot-3a89b', 'asia-east1', commandMessage);
}

//生理資訊手環歷史資訊儲存
export const savetaghistory = functions.firestore
    .document('personal-accounts/{accountID}/peoples/{tagMAC}')
    .onUpdate(async (snapshot, context) => {
    var nowDate = new Date();
    var time = moment( nowDate ).tz("Asia/Taipei")
    var t = time.format("YYYY-MM-DDTHH:mm:ss.SSSZ").split("+08:00")[0]+"Z"//轉換ISOstring 供網頁使用
    var utct = moment().utc(nowDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ").split("+00:00")[0]+"Z" //網頁需求
    var TIME = {Time:t,
                UTCTIME:utct } 
    const previousData = snapshot.before.data();
    const currentData = snapshot.after.data();
    if (currentData.physiological == previousData.physiological) { 
        console.log('imformation didnt change')
        return 'imformation didnt change' };
    await database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("healthyreport").doc(time.format("YYYY")).set({},{merge:true}) //避免doc 不存在
    await database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("healthyreport").doc(time.format("YYYY")).collection(time.format("MM-DD")).doc(time.format("HH:mm:ss")).set(previousData)
    await database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("healthyreport").doc(time.format("YYYY")).collection(time.format("MM-DD")).doc(time.format("HH:mm:ss")).update(TIME)
    console.log('history save OK')
    return 'history save OK'
})

export const savealerthistory = functions.firestore
    .document('personal-accounts/{accountID}/peoples/{tagMAC}')
    .onUpdate(async (snapshot, context) => {
   
    const currentData = snapshot.after.data();
    var now = new Date();
    var timestamp = moment(now).tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss.SSSZ") 
    if(currentData.physiological.HR < 50 || currentData.physiological.HR > 90){
        database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("alertreport").doc()
        .set({alert:"physiological",comment:"Heart Rate"+currentData.physiological.HR,timestamd:timestamp});
    }
    if(currentData.physiological.Power < 20){
        database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("alertreport").doc()
        .set({alert:"power",comment:"Power"+currentData.physiological.Power,timestamd:timestamp});
    }
    if(currentData.physiological.TEMP < 35.0 || currentData.physiological.TEMP > 38.0){
        database.collection("personal-accounts").doc(context.params.accountID).collection("peoples").doc(context.params.tagMAC).collection("alertreport").doc()
        .set({alert:"physiological",comment:"temperature"+currentData.physiological.TEMP,timestamd:timestamp});
    }
    console.log('alert trigger')
    return 'alert trigger'
})


// ------------------------


