export class Account {
    firebaseID: string;
    name: string;
    email: string;
    phone: string;
    secretCode: number;                                     // 藍芽的密碼 if role = manager
    role: string;                                           // 權限 manager, customer
    family?: Array<string>;                                        // family firebase id
    messageNumber: number;
    serverCreationTime: string;                             // 建立資料的時間，不會更改
}

export class Location {
    address: string;
    requestArrivedTime: string;                             // 建立資料的時間，不會更改
    timestamp?: string;                                     // 最後更新的時間
}

export class Floor {
    imageUrl?: string;                                       // 從 storage 取得的 url
    floor?: string;                                          // 樓層
    upperLeft?: {
        longitude: number;
        latitude: number;
    };
    lowerRight?: {
        longitude: number;
        latitude: number;
    };
    requestArrivedTime?: string;                              // 建立資料的時間，不會更改
    timestamp?: string;                                       // 最後更新的時間
    generation: string;                                       //the generation of floor image in firestore
}

export class People {
    name: string;
    tagMAC: string;
    contact?: Device;
    movement: number;
    totalSitTimer: number;
    openDoorNumber: number;
    openDrawerNumber: number;
    WCNumber: number;
    drinkNumber: number;
    falldownNumber: number;
    sittingPosition:{
        full: number;
        front: number;
        left: number;
        right: number;
        fidget: number;
    };
    standingPosition:{
        full: number;
        front: number;
        left: number;
        right: number;
        fidget: number;
    };
    timestamp?: string;
}

export class PeopleRecord {
    name: string;
    tagMAC: string;
    contact: Device;
    movement: number;
    totalSitTimer: number;
    openDoorNumber: number;
    openDrawerNumber: number;
    WCNumber: number;
    drinkNumber: number;
    falldownNumber: number;
    sittingPosition:{
        full: number;
        front: number;
        left: number;
        right: number;
        fidget: number;
    };
    standingPosition:{
        full: number;
        front: number;
        left: number;
        right: number;
        fidget: number;
    };
    timestamp: string;
    UTCtimestamp: string;
}

// export class Device {
//     MAC_address?: string;
//     recordNumber?: number;
//     from: From;
//     petacom: Petacom;
//     hopping: string;                                        // protocol 封包最後面 hoping 部份
//     timestamp: string;                                      // raspberry pi 收到資料的時間
//     requestArrivedTime?: string;                            // 最後更新的時間
//     serverCreationTime?: FirebaseFirestore.FieldValue;
//     fixedDevice?: FixedDevice;                              // 固定式裝置才有，Data from APP
//     tag?: Tag;                                              // 移動式裝置才有，Data from raspberry pi
// }

export class DeviceRecord {
    from: From;
    MAC_address: string;                                    // 裝置 mac address
    wifi_address: string;
    name?: string;                                          // 給使用者
    deviceName?: string;                                    // 給APP
    petacom?: Petacom;                                       // protocol 解析而來
    geoPoint: {
        longitude: string;
        latitude: string;
    };
    hopping: string;                                        // protocol 封包最後面 hoping 部份
    icon: string;
    status: string;
    height: number;                                         // 高度，由APP設定得來
    type: string;                                           // 區別node, router，由APP設定得來
    timestamp: string;                                      // raspberry pi 收到資料的時間                         
    requestArrivedTime: string;                             // 設定時的時間
    recordNumber?: number;
    tagVisible?: boolean;
}

// Final version
export class Device {
    from: From;
    MAC_address: string;                                    // 裝置 mac address
    wifi_address: string;
    name?: string;                                          // 給使用者
    deviceName?: string;                                    // 給APP
    petacom?: Petacom;                                       // protocol 解析而來
    geoPoint: {
        longitude: string;
        latitude: string;
    };
    hopping: string;                                        // protocol 封包最後面 hoping 部份
    icon: string;
    status: string;
    height: number;                                         // 高度，由APP設定得來
    type: string;                                           // 區別node, router，由APP設定得來
    timestamp: string;                                      // raspberry pi 收到資料的時間                         
    requestArrivedTime: string;                             // 設定時的時間
    recordNumber?: number;
    tagVisible?: boolean;
    tagMAC?: Array<string>;                                 // For Garbage Test
    duration?: number;                                      // For Garbage Test
    movement?: number;                                      // For Garbage Test
    thing?: {
        sittingPosition?: string;
        voltagePercentage?: string;
        lowPower?: string;
        noMove?: boolean;
        falldown?: boolean;
        falldownStatus?: boolean;
        temperature?: number;
        humidity?: number;
        Status?:string;
    }
}

export class Petacom {
    master: string;                                         // 主體
    direction: string;                                      // 傳輸方向
    events: string;                                         // 包含群體關係等事件
    status: string;                                         // on or off
    // coherenceItem?: CoherenceItem;                          // 感測器種類, 依附物品
    deviceMac?: string;                                     // Tag 夾帶的 device(特殊事件）
    time: string;                                           // protocol 定義的 time
}

export class CoherenceItem {
    kind?: string;
    thing?: any;
}

export class From {
    firebaseID: string;
    locationID: string;                                        // 地址
    floorID: string;                                        // 樓層
    routerID?: string;                                       // 由哪個router傳來
}

export class Behavior {
    behavior?: string;                                      // 當時猜測的行為
}

export class Message {
    title: string;
    payload: string;
    from?: string;                                          // Web, APP, Line
    who?: {
        from: string;
        target: string;
    };
    requestArrivedTime?: string;                              // 建立資料的時間，不會更改
    timestamp?: string;                                       // 最後更新的時間
}

export class Patient {
    family: string;                                         // account firebase id
    name: string;
    gender: string;
    age: number;
    level: number;                                          // 照護員進階設定
    height: number;                                         // 身高(m)
    tag: string;                                            // 手環
    socialID: string;
    requestArrivedTime?: string;                              // 建立資料的時間，不會更改
    timestamp?: string;                                       // 最後更新的時間
}

export class MobileDevice {
    mobileName: string;
    token: string;
    requestArrivedTime?: string;                              // 建立資料的時間，不會更改
    timestamp?: string;                                       // 最後更新的時間
}

export class Target {
    target: string;
    iat: number;
    exp: number;
}

export class FireSensor {
    kind: string;                                           // 煙霧警報器, 定溫警報器...etc
    type: string;                                           // 光電侷限型, 光電防水型...etc
    serialNumber?: string;
    status: FireSensorStatus;
    voltage: string;
}

export class FireSensorStatus {
    standby: string;
    action: string;
    voltageState: string;
    connection: string;
    test: string;
    power: string;
    setting: string;
}

export class PressureSensor {
    type: string;
    sensorValue: string;
    status: string;
}

export class ReedSwitch {
    type: string;
    sensorValue: string;
    status: string;
}

export class ProximitySensor {
    type: string;
    sensorValue: string;
    status: string;
}
