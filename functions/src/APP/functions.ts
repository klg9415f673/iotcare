import * as functions from 'firebase-functions'
import * as firebaseAdmin from 'firebase-admin';
import * as cors from 'cors'

const corsHandler = cors({ origin: true })
const database = firebaseAdmin.firestore()


export const APPsocket = functions.https.onRequest((req: functions.Request, res: functions.Response) => {
    console.log("method ", req.method)
    if (req.headers.auth != 'UTL'){
        console.log('header error')
        return res.status(401).send('header auth error').end()
    }
    const target = req.body.target
    corsHandler(req, res, async () => {
        switch (req.method) {
            case "POST":
                //test(req, res)
                break
            case "GET":
                break
            case "PUT":
                break
            case "DELETE":
                console.log("Headers:",req.headers)
                console.log("BODY:",req.body)
                DELETE(target,req, res)
                break
            default:
                break
        }
    })
})


const DELETE = async (target:String, req: functions.Request, res: functions.Response) => {
    switch (target){
    case 'device':
        deleteDevice(req, res)
        break
    }
}
const deleteDevice = async (req: functions.Request, res: functions.Response) =>{
    const payload = {
        locationID: req.body.locationID as string,
        floorID: req.body.floorID as string,
        deviceID: req.body.deviceID as string,
        firebaseID: req.body.firebaseID as string
    }
    await database.collection('personal-accounts').doc(payload.firebaseID).get().then(result=>{
        if (result.data().role != 'manager'){
            return res.status(401).send('role error, not manager').end()
        }
        else{
            database.collection('personal-accounts').doc(payload.firebaseID).collection('locations').doc(payload.locationID).collection('floors')
            .doc(payload.floorID).collection('devices').doc(payload.deviceID).delete();
            console.log(`delete ${payload.firebaseID}-${payload.locationID}-${payload.floorID}-${payload.deviceID} success`)
            return res.status(200).send(`delete ${payload.deviceID} success`).end()
        }
    })
  
}
const test = async (req: functions.Request, res: functions.Response) =>{
    let ref = database.collection("personal-accounts").doc("ui9nr5vUoQPnQuPZj6sou7fSial2").collection("peoples")
    ref.get().then((querySnapshot)=>{
    console.log("準備進入一")
       querySnapshot.forEach(async(doc)=>{
           console.log("已經進入一")
            let reportRef = ref.doc(doc.id).collection("healthyreport").doc("2020").collection("08-30")
            await reportRef.get().then((reportSnapshot) => {
                console.log("準備進入二")
                reportSnapshot.forEach((report)=>{
                    console.log("已經進入二")
                    console.log(report)
                })
            })
       })
    })
    return res.status(200).send("test send").end()
}