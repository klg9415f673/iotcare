import * as functions from 'firebase-functions';
import * as firebaseAdmin from "firebase-admin"
import * as cors from 'cors'


const corsHandler = cors({ origin: true })
const database = firebaseAdmin.firestore()

export const tagService = functions.https.onRequest((req: functions.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {
        switch (req.method) {
            case "POST":
                // createCamera(req, res)
                break
            case "GET":
                // getCamera(req, res)
                break
            case "PUT":
                updateTag(req, res)
                break
            case "DELETE":
                deleteTag(req, res)
                break
            default:
                break
        }
    })
})

const updateTag = async (req: functions.Request, res: functions.Response) => {
    console.log("update req body : ", req.body)

    res.status(200).send("OK")
}

const deleteTag = async (req: functions.Request, res: functions.Response) => {
    console.log("delete req body : ", req.body)
    const tagData = req.body.disappear_array;

    if (Array.isArray(tagData)) {
        for (var data of tagData) { //多個
            console.log(data)
            await tagVisible_false(data)
        }
    } else if (typeof tagData === 'string') { //單個
        console.log(tagData)
        await tagVisible_false(tagData)
    }


    res.status(200).send("OK")
}

const tagVisible_false = async(data: string) => {
    const mac = data.substr(0,12)
    const firebaseID = data.substr(12,28)
    const changeData = { tagVisible: false }
    await database.collection("personal-accounts").doc(firebaseID).
            collection("mobile-tags").doc(mac).set(changeData, { merge: true })
    console.log(mac, "tagVisible false")

}