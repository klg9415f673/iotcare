import { FireSensorStatus, FireSensor, Petacom, PressureSensor, DeviceRecord, ReedSwitch, ProximitySensor, From, Device, CoherenceItem } from "./../model/UTLmodel";

const getBinaryString = (string: string) => {
    let result = '';
    const stringArray = string.split('');
    stringArray.forEach(stringElement => {
        let binaryString = parseInt(stringElement, 16).toString(2);
        while (binaryString.length < 4) {
            binaryString = '0'.concat(binaryString);
        }
        result = result.concat(binaryString);
    });
    return result;
}


const decideMaster = (binaryString) => {
    let master: string;
    switch (binaryString) {
        case '00': master = '人'; break;
        case '01': master = '動物'; break;
        case '10': master = '移動載具'; break;
        case '11': master = '非穿戴式'; break;
    }
    return master;
}

const pressureStatus = (binaryString: string) => {
    const statusBinary = binaryString.substr(56, 8);
    let status: string;
    switch (statusBinary) {
        case '00000000': status = 'off'; break;
        case '00000001': status = 'on'; break;
        default: status = 'undefined'; break;
    }
    return status;
}

const reedStatus = (binaryString: string) => {
    const statusBinary = binaryString.substr(56, 8);
    let status: string;
    switch (statusBinary) {
        case '00000000': status = 'off'; break;
        case '00000001': status = 'on'; break;
        default: status = 'undefined'; break;
    }
    return status;
}

const decideOnOff = (binaryString: string) => {
    const statusBinary = binaryString.substr(63, 1);
    // console.log('on off', statusBinary)
    let status: string;
    switch (statusBinary) {
        case '0': status = 'off'; break;
        case '1': status = 'on'; break;
    }
    return status;
}

export const decodeCushionThing = (packet: string) => {
    const thing = packet.substr(38, 16);
    const thingBinaryString = getBinaryString(thing);

    const sittingPositionBinary = thingBinaryString.substr(0, 8);
    const lowPowerBinary = thingBinaryString.substr(55, 1)

    let lowPower: string;
    switch (lowPowerBinary) {
        case '0': lowPower = '正常電量'; break;
        case '1': lowPower = '低電量'; break;
    }
    let sittingPosition: string;
    switch (sittingPositionBinary) {
        case '00000010': sittingPosition = '左'; break;
        case '00000100': sittingPosition = '右'; break;
        case '00001000': sittingPosition = '前'; break;
        case '00000001': sittingPosition = '滿'; break;
        case '00010000': sittingPosition = '坐立不安'; break;
        default: sittingPosition = sittingPositionBinary; break;
    }
    console.log("decodeCushionThing : ", sittingPosition, lowPower)
    return { sittingPosition, lowPower };
}

export const decodePosition = (packet: string) => {
    const thing = packet.substr(38, 16);
    const thingBinaryString = getBinaryString(thing);

    const positionBinary = thingBinaryString.substr(48, 8);
    let position: string;
    switch (positionBinary) {
        case '00000010': position = '左'; break;
        case '00000100': position = '右'; break;
        case '00001000': position = '前'; break;
        case '00000001': position = '滿'; break;
        case '00010000': position = '坐立不安'; break;
        default: position = positionBinary; break;
    }

    console.log("decodePosition : ", position)
    return position;
}


export const decodeTagThing = (packet: string) => { //穿戴式感測器 bTag 護身符
    const thing = packet.substr(38, 16);
    const thingBinaryString = getBinaryString(thing);

    const voltagePercentageBinary = thingBinaryString.substr(8, 8);
    let voltagePercentage = parseInt(voltagePercentageBinary, 2).toString() + "%"

    // const noMoveBinary = thingBinaryString.substr(23, 1);
    // let noMove
    // if (noMoveBinary == "1") {
    //     noMove = true;
    // } else {
    //     noMove = false;
    // }

    // const falldownBinary = thingBinaryString.substr(31, 1);
    // let falldown
    // if (falldownBinary == "1") {
    //     falldown = true;
    // } else {
    //     falldown = false;
    // }

    // const falldownStatusBinary = thingBinaryString.substr(39, 1);
    // let falldownStatus
    // if (falldownStatusBinary == "1") {
    //     falldownStatus = true;
    // } else {
    //     falldownStatus = false;
    // }

    const status = thing.substr(12,2)//48~55
    let Status
    switch (status){
        case "00" :
            
            Status = "Original"
            break;
        case "01" :
           
            Status = "sitting"
            break;
        case "02" :
            
            Status = "standing"
            break;
        case "03" :
            
            Status = "walking"
            break;
        case "04" :
           
            Status = "falldown"
            break;
            

    }
        

    //console.log("thing:", thingBinaryString)
    console.log("decodeTagThing : ", { voltagePercentage,Status })
    return { voltagePercentage, Status};
}

export const decodePhysiologicalThing = (packet: string) => { //近接式感測器 bTag 生理資訊手環
    function hex2Decimal(hexx:any) {   //hex 轉 dec , ex:  16 => 22  , 1111 => 17 17
        var hex = hexx.toString();
        var str = '';
        for (var i = 0; (i < hex.length); i += 2)
            str += parseInt(hex.toString().substr(i, 2), 16);
        return str;
    }
    
    const Mileage = parseInt(hex2Decimal(packet.substr(0, 4)));
    const Calories = parseInt(hex2Decimal(packet.substr(4, 4)));
    const Power = parseInt(hex2Decimal(packet.substr(8, 2)));
    const HR = parseInt(hex2Decimal(packet.substr(10, 2)));
    const temp = hex2Decimal(packet.substr(12, 4));
    const TEMP = parseFloat(temp.substr(0,2)+"."+temp.substr(2,2))
   
    return { Mileage, Calories, Power, HR, TEMP};
}


export const decodeTemperatureAndHumiditysensor = (packet: string) => {
    const thing = packet.substr(38, 16);

    const temperatureHex = thing.substr(0,4)
    const humidityHex = thing.substr(4,4)
    console.log("Th : ", temperatureHex,"  Hh : ",humidityHex)
    let temperature = parseInt(temperatureHex,16) / 100
    if (temperature >= 327){
        temperature = temperature - 655
    } 
    let humidity = parseInt(humidityHex,16) / 100
    console.log("T : ", temperature,"  H : ",humidity)


    return { temperature, humidity }
}

const decidePressureSensor = (binaryString: string) => {
    // tslint:disable-next-line:prefer-const
    let pressureSensor = new PressureSensor;
    switch (binaryString.substr(4, 4)) {
        case '0000': pressureSensor.type = '坐墊'; break;
        case '0001': pressureSensor.type = '床墊（頭）'; break;
        case '0010': pressureSensor.type = '床墊（上半身）'; break;
        case '0011': pressureSensor.type = '床墊（下半身）'; break;
        case '0100': pressureSensor.type = '背墊'; break;
        case '0101': pressureSensor.type = '踏墊（馬桶）'; break;
        case '0110': pressureSensor.type = '踏墊（小便斗）'; break;
        case '0111': pressureSensor.type = '踏墊（淋浴間）'; break;
        case '1000': pressureSensor.type = '踏墊（浴盆）'; break;
        case '1001': pressureSensor.type = '踏墊（洗臉盆）'; break;
        default: pressureSensor.type = 'undefined'; break;
    }
    pressureSensor.sensorValue = parseInt(binaryString.substr(8, 48), 2).toString(16).toUpperCase();
    pressureSensor.status = pressureStatus(binaryString);
    return pressureSensor;
}

const decideReedSwitch = (binaryString: string) => {
    // tslint:disable-next-line:prefer-const
    let reedSwitchSensor = new ReedSwitch;
    switch (binaryString.substr(4, 4)) {
        case '0000': reedSwitchSensor.type = '大門'; break;
        case '0001': reedSwitchSensor.type = '窗戶'; break;
        case '0010': reedSwitchSensor.type = '櫥櫃'; break;
        case '0011': reedSwitchSensor.type = '抽屜'; break;
        case '0100': reedSwitchSensor.type = '冰箱門'; break;
        case '0101': reedSwitchSensor.type = '微波爐門'; break;
        case '0110': reedSwitchSensor.type = '烤箱門'; break;
        case '0111': reedSwitchSensor.type = '洗碗機門'; break;
        case '1000': reedSwitchSensor.type = '瓦斯開關'; break;
        case '1001': reedSwitchSensor.type = '水龍頭開關'; break;
        case '1010': reedSwitchSensor.type = '瓦斯爐開關'; break;
        default: reedSwitchSensor.type = 'undefined'; break;
    }
    reedSwitchSensor.sensorValue = 'undefined';
    reedSwitchSensor.status = reedStatus(binaryString);
    return reedSwitchSensor;
}

const decideProximitySensor = (binaryString: string) => {
    // tslint:disable-next-line:prefer-const
    let proximitySensor = new ProximitySensor;
    switch (binaryString.substr(4, 4)) {
        case '0000': proximitySensor.type = '水壺或飲水機'; break;
        case '0001': proximitySensor.type = '各類電器用品'; break;
        case '0010': proximitySensor.type = '藥盒'; break;
        case '0011': proximitySensor.type = '復健設備1'; break;
        case '0100': proximitySensor.type = '復健設備2'; break;
        case '0101': proximitySensor.type = '復健設備3'; break;
        case '0110': proximitySensor.type = '盆栽'; break;
        case '0111': proximitySensor.type = '各種家庭用工具'; break;
        case '1100': proximitySensor.type = '高價展示商品'; break;
        case '1101': proximitySensor.type = '動物園的餵食區'; break;
        case '1110': proximitySensor.type = '植物園的植物'; break;
        case '1111': proximitySensor.type = '畫作藝術品'; break;
        default: proximitySensor.type = 'undefined'; break;
    }
    proximitySensor.sensorValue = 'undefined';
    proximitySensor.status = 'undefined';
    return proximitySensor;
}

const smokeSensorDecode = (binaryString: string) => {
    let sensorType: string;
    switch (binaryString.substr(8, 8)) {
        case '00000000': sensorType = '光電侷限型'; break;
        case '00000001': sensorType = '光電防水型'; break;
        case '00000010': sensorType = '光電防暴型'; break;
        case '00000011': sensorType = '離子侷限型'; break;
        case '00000100': sensorType = '離子防水型'; break;
        case '00000101': sensorType = '離子防暴型'; break;
        case '00000110': sensorType = '分離型'; break;
        case '00000111': sensorType = '分離防水型'; break;
        case '00001000': sensorType = '分離防暴型'; break;
        case '00001001': sensorType = '雷射型'; break;
        case '00001010': sensorType = '雷射防水型'; break;
        case '00001011': sensorType = '雷射防暴型'; break;
        default: sensorType = 'undefined'; break;
    }
    return sensorType;
}

const smokeStatus = (binaryString: string) => {
    // tslint:disable-next-line:prefer-const
    let smoke = new FireSensorStatus;
    const statusBinary = binaryString.substr(24, 8);

    switch (statusBinary[0]) {
        case '0': smoke.standby = '正常'; break;
        case '1': smoke.standby = '監視中'; break;
    }

    switch (statusBinary[1]) {
        case '0': smoke.action = '正常'; break;
        case '1': smoke.action = 'alarm'; break;
    }

    switch (statusBinary[2]) {
        case '0': smoke.voltageState = '正常'; break;
        case '1': smoke.voltageState = '弱電'; break;
    }

    switch (statusBinary[3]) {
        case '0': smoke.connection = '正常'; break;
        case '1': smoke.connection = '離線'; break;
    }

    switch (statusBinary[4]) {
        case '0': smoke.test = '非測試狀態'; break;
        case '1': smoke.test = '測試狀態'; break;
    }

    switch (statusBinary[5]) {
        case '0': smoke.power = '有主電源狀態'; break;
        case '1': smoke.power = '無主電源狀態'; break;
    }

    switch (statusBinary[6]) {
        case '0': smoke.setting = '未成功設定經緯高度'; break;
        case '1': smoke.setting = '成功設定經緯高度'; break;
    }
    return smoke;
}

const fireSensorVoltage = (binaryString: string) => {
    console.log('voltage binaryString', binaryString)
    const voltageBinary = binaryString.substr(56, 8);
    return (parseInt(voltageBinary, 2) * 42.656 / 455).toFixed(2);
}

const decideFireSensor = (binaryString: string) => {
    // tslint:disable-next-line:prefer-const
    let fireSensor = new FireSensor;
    const kindBinary = binaryString.substr(4, 4);
    switch (kindBinary) {
        case '0000': {
            fireSensor.type = '煙霧感測器';
            fireSensor.kind = smokeSensorDecode(binaryString);
            fireSensor.status = smokeStatus(binaryString);
            fireSensor.voltage = fireSensorVoltage(binaryString);
            break;
        }
        case '0001': fireSensor.kind = '定溫警報器'; break;
        case '0010': fireSensor.kind = '瓦斯警報器（可燃氣體偵測器）';

            break;
        case '0011': fireSensor.kind = '一氧化碳警報器'; break;
        case '0100': fireSensor.kind = 'IR火焰警報器'; break;
        case '0101': fireSensor.kind = '複合式（煙溫）警報器'; break;
        case '0110': fireSensor.kind = '複合式（瓦斯+CO）警報器';


            break;
        case '0111': fireSensor.kind = '複合式（預留）警報器'; break;
        case '1000': fireSensor.kind = '複合式（預留）警報器'; break;
        case '1001': fireSensor.kind = '警報器'; break;
        default: fireSensor.kind = 'undefined'; break;
    }
    return fireSensor;
}

// parameter 為物的第一個byte => 8個字元，感測器種類和附著物品
const decideKindAndThing = (binaryString: string) => {
    let kind: string;
    let thing: any;
    switch (binaryString.substr(0, 4)) {
        case '0000':
            kind = '壓力感測器';
            thing = decidePressureSensor(binaryString);
            break;

        case '0001':
            kind = '磁簧開關';
            thing = decideReedSwitch(binaryString);
            break;

        case '0010':
            kind = '近接感測器';
            thing = decideProximitySensor(binaryString);
            break;

        case '0011':
            kind = '加速度計/陀螺儀/羅盤';
            thing = 'undefined'
            break;

        case '0101':
            kind = '消防感測器';
            thing = decideFireSensor(binaryString);
            break;

        default:
            kind = 'undefined';
            thing = 'undefined';
            break;
    }
    return { kind, thing };
}

const getWifiAddress = (binaryString: string) => {
    const wifiAddress = parseInt(binaryString, 2).toString(16).substr(0, 12);
    return wifiAddress;
}

const getPassiveDevice = (binaryString: string) => {
    const macBinaryString = binaryString.substr(0, 48);
    return parseInt(macBinaryString, 2).toString(16).toUpperCase();
}

const decodeFormat = (mode: string, thing: string, time: string) => {
    const modeBinaryString = getBinaryString(mode);
    const thingBinaryString = getBinaryString(thing);
    const master = decideMaster(modeBinaryString.substr(0, 2));
    // const sensorValue = thingBinaryString.substr(8, 24);
    const status = decideOnOff(thingBinaryString); //加入type做更多判斷
    let direction: string;
    let events: string;
    let deviceMac: string;
    switch (modeBinaryString.substr(2, 2)) {
        case '00':
            direction = '非緊急上傳';
            switch (modeBinaryString.substr(4, 4)) {
                case '0000': events = 'bNode報平安'; break;
                case '0001': events = 'Router報平安'; break;
                case '0010': events = '非穿戴感測器報平安';   //溫濕度

                    break;
                case '0011': events = '待訂'; break;              // bNode + 感測器 ？
                case '0100': //手環定位
                    events = '穿戴式感測器 bTag';

                    break;
                case '0101': events = '可攜式感測器 bTag'; ; break; // 會夾帶device的MAC 護身符
                case '0110': events = '近接式感測器 bTag'; break;     //生理資訊手環
                case '0111': events = '上傳阻礙'; break;              // 上傳阻礙？
                case '1000': //手還發出
                    events = '人與物相遇 bTag';
                    deviceMac = getPassiveDevice(thingBinaryString);

                    break;
                case '1001': events = '兩人相遇'; deviceMac = getPassiveDevice(thingBinaryString); break;              // 會夾帶device的MAC
                case '1010': events = '兩物相遇'; deviceMac = getPassiveDevice(thingBinaryString); break;              // 會夾帶device的MAC
                case '1011': events = '物與人相遇'; deviceMac = getPassiveDevice(thingBinaryString); break;              // 會夾帶device的MAC
                case '1100': events = '兩人以上相遇'; break;
                case '1101': events = '兩物以上相遇'; break;
                case '1110': // 固定式感測器發出
                    events = '人與物相遇';

                    break;
                case '1111': events = '人與物相遇，物品位置受更動，須校正'; break; // App設定後由device送出
            }
            break;

        case '01':
            direction = '緊急上傳';
            switch (modeBinaryString.substr(4, 4)) {
                case '0000': events = 'bTag產生異常感測值'; break;
                case '0001': events = 'bNode產生異常感測值'; break;
                case '0010': events = '穿戴式裝置緊急按鈕'; break;
                case '0011': events = '手機緊急按鈕'; break;
                case '0100': events = '感測器電量不足'; break;                 // bTag 感測器電量不足（包含近接式以及接觸式）
                case '0101': events = '穿戴式裝置bTag電量不足'; break;                // 穿戴式裝置電量不足
                case '0110': events = '消防感測器'; break;
                case '0111': events = 'undefined'; break;
            }
            break;

        case '10':
            direction = '非緊急下載';
            switch (modeBinaryString.substr(4, 4)) {
                case '0000': events = 'Mesh/router 設定'; break;
                case '0001': events = 'bNode 時間同步'; break;
                case '0010': events = 'Router 時間同步'; break;
                case '0011': events = '通報資料傳送至行動裝置'; break;
                case '0100': events = '控制資料由 bNode 到 bwRouter'; break;
                case '0101': events = '更新資料經 bwRouter 去 OAD'; break;
                case '0110': events = '控制資料傳送至 Node or bTag'; break;
                case '0111': events = '下載阻礙'; break;      // 存在的必要性？            
                case '1000': events = '手機或手環對 Node or bTag 遙控'; break;
                case '1001': events = '手機或手環對 Node or bTag 傳送資料'; break;
                case '1010': events = 'Node 對外傳送自身訊息'; break;
                case '1011': events = 'Tag 與 Tag 互傳訊息'; break;
                case '1100': events = '尋人啟事'; break;
                case '1101': events = '尋人啟事啟動或清除'; break;
                case '1110': events = '尋物啟事'; break;
                case '1111': events = '尋物啟事啟動或清除'; break;
            }
            break;

        case '11':
            direction = '緊急下載';
            switch (modeBinaryString.substr(4, 4)) {
                case '0000': events = '致動器bTag緊急啟動'; break;
                case '0001': events = 'bNode 致動器緊急啟動'; break;
                case '0010': events = '消防系統緊急啟動'; break;
                case '0011': events = '機器人緊急啟動'; break;
                case '0100': events = '電梯關閉'; break;     // 地震 火災               
                default: events = 'undefined'; break;
            }
            break;
    }
    return { master, direction, events, deviceMac, time, status };
}
// mode macaddress  time longitude  latitude        thing          hopping            firebaseID               locationID            floorID          routerID           timestamp
//  3       12        4     10          9             16             14                    28                      20                    20              12                     26
// $04 A0E6F834602D 0000 121.535840 25.042635 0000000000000000 89593827390703 28BYBbJzIRWHxYIKfkpAaIPbjDd2 teAESXu89GYtdZQzwV9X 29zxilzYLjpZzL6ChWyi 546C0EA502D7 2019-01-15 18:51:14.419046
// $04 A0E6F834602D 0000 121.535840 25.042635 0000000000000000 89593827390703 28BYBbJzIRWHxYIKfkpAaIPbjDd2 ukNrvotj9VdNBnAYcZvp 9qBSvD7dzgpnFcXsIPAd 546C0EA502D7 2019-01-14 19:57:44.044674
// $C2 0C61CF39880B 7100 121.535935 25.042879 5000002000000051 89593827390703 28BYBbJzIRWHxYIKfkpAaIPbjDd2 ukNrvotj9VdNBnAYcZvp 9qBSvD7dzgpnFcXsIPAd 546C0EA502D7 2019-01-14 19:57:44.044674
export const decodePetacomFormat = (packet: string) => {
    let device = new Device;
    const mode = packet.substr(1, 2);
    const macAddress = packet.substr(3, 12);
    const time = packet.substr(15, 4);
    const longitude = packet.substr(19, 10);
    const latitude = packet.substr(29, 9);
    const thing = packet.substr(38, 16);
    const hopping = packet.substr(54, 14);
    const firebaseID = packet.substr(68, 28);
    const locationID = packet.substr(96, 20);
    const floorID = packet.substr(116, 20);
    const routerID = packet.substr(136, 12);
    const timestamp = packet.substr(148, 26);

    const petacom = decodeFormat(mode, thing, time) as Petacom
    if(petacom.deviceMac ===undefined){petacom.deviceMac = macAddress}
    const from = {
        firebaseID: firebaseID,
        locationID: locationID,
        floorID: floorID,
        routerID: routerID
    } as From

    if (petacom.events.search('Tag') !== -1) {     // 移動式裝置
        device = {
            MAC_address: macAddress,
            from: from,
            petacom: petacom,
            hopping: hopping,
            geoPoint: {
                longitude: longitude, latitude: latitude
            },
            timestamp: timestamp,
            tagVisible: true
        } as Device;
    } else {                                // 固定式裝置
        device = {
            MAC_address: macAddress,
            from: from,
            petacom: petacom,
            hopping: hopping,
            timestamp: timestamp,
        } as Device;
    }
    console.log("petacom : ",device)
    return { device };
}

