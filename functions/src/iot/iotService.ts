import { google } from 'googleapis';

/**
 * service account 位置有可能會隨著GCP更新而不同
 */
const serviceAccount = './lib/serviceAccountKey.json';

const API_VERSION = 'v1';
const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';


const lookupRegistry = (client, registryID: string, projectID: string, cloudRegion: string, cb) => {
    console.log("lookupRegistry")
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const request = { name: registryName };

    client.projects.locations.registries.get(request, (err, res) => {
        if (err) {
            console.log('Could not look up registry', err);
        } else {
            console.log('Looked up existing registry', res.data);
        }
    });
}

const createRegistry = (client, registryID: string, projectID: string, cloudRegion: string, pubsubTopicID: string, foundCb) => {
    console.log("createRegistry")
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const pubsubTopic = `projects/${projectID}/topics/${pubsubTopicID}`;
    const request = {
        parent: parentName,
        resource: {
            eventNotificationConfigs: [{
                pubsubTopicName: pubsubTopic
            }],
            id: registryID
        }
    };

    client.projects.locations.registries.create(request, (err, res) => {
        if (err) {
            if (err.code === 409) {
                // The registry already exists, look it up instead.
                foundCb(client, registryID, projectID, cloudRegion);
            } else {
                console.log('Could not create registry');
            }
        } else {
            console.log('Successfully created registry', res.data);
        }
    })
}

const createRsaDevice = (client, deviceID: string, registryID: string, projectID: string, cloudRegion: string, rsaPublicKey: string) => {
    console.log("createRsaDevice")
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;

    const body = {
        id: deviceID,
        credentials: [{
            publicKey: {
                format: 'RSA_PEM',
                key: rsaPublicKey,
            }
        }]
    }

    const request = {
        parent: registryName,
        resource: body
    }

    console.log('create rsa device request', request);

    client.projects.locations.registries.devices.create(request, (error, res) => {
        if (error) {
            console.log('Could not create device', error);
            return error;
        } else {
            console.log('Created device', res.data);
            return res.data;
        }
    });
}

const listDevices = (client, registryID: string, projectID: string, cloudRegion: string) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const request = { parent: registryName };

    client.projects.locations.registries.devices.list(request, (error, res) => {
        if (error) {
            console.log('Could not list devices', error);
        } else {
            const data = res.data;
            console.log('Current devices in registry:', data['devices']);
        }
    })
}

const lookupOrCreateRegistry = (client: any, registryID: string, projectID: string, cloudRegion: string, pubsubTopic: string) => {
    console.log("lookupOrCreateRegistry")
    createRegistry(client, registryID, projectID, cloudRegion, pubsubTopic, lookupRegistry);
}

// const listRegistries = (client, projectID, cloudRegion) => {
//     const parentName = `projects/${projectID}/locations/${cloudRegion}`;
//     const request = { parent: parentName };

//     client.projects.locations.registries.list(request, (error, res) => {
//         if (error) {
//             console.log('Could not list registries', error);
//         } else {
//             const data = res.data;
//             console.log('Current registries in project:', data['deviceRegistries']);
//         }
//     });
// }

const deleteDevice = (client: any, deviceID: string, registryID: string, projectID: string, cloudRegion: string, cb: Function) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const request = { name: `${registryName}/devices/${deviceID}` };

    client.projects.locations.registries.devices.delete(request, (error, res) => {
        if (error) {
            console.log('Could not delete device:', deviceID);
        } else {
            console.log('Successfully deleted device:', deviceID, '+', res.data);
            if (cb) { cb(); }
        }
    })
}

const clearRegistry = (client, registryID: string, projectID: string, cloudRegion: string) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const requestDelete = { name: registryName };

    const after = () => {
        client.projects.locations.registries.delete(requestDelete, (error, res) => {
            if (error) {
                console.log('Could not delete registry', error);
            } else {
                console.log(`Successfully deleted registry ${registryName}`, res.data);
            }
        });
    }

    const request = { parent: registryName };

    client.projects.locations.registries.devices.list(request, (error, res) => {
        if (error) { console.log('Could not list devices', error) }
        else {
            const data = res.data;
            console.log('Current devices in registry:', data['devices']);
            const devices = data['devices'];
            if (devices) {
                devices.forEach((device, index) => {
                    console.log(`${device.id} [${index}/${devices.length}] removed`);
                    if (index === devices.length - 1) {
                        deleteDevice(client, device.id, registryID, projectID, cloudRegion, after);
                    } else { after() }
                })
            }
        }
    })

}

const getDeviceState = (client, deviceID: string, registryID: string, projectID: string, cloudRegion: string) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const request = { name: `${registryName}/devices/${deviceID}` };

    client.projects.locations.registries.devices.states.list(request, (error, res) => {
        if (error) { console.log('Could not find device:', deviceID) }
        else { console.log('State:', res.data) };
    })

}

const sendCommand = (client, deviceID: string, registryID: string, projectID: string, cloudRegion: string, commandMessage: string) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const binaryData = Buffer.from(commandMessage).toString('base64');
    const request = {
        name: `${registryName}/devices/${deviceID}`,
        binaryData: binaryData
    };

    client.projects.locations.registries.devices.sendCommandToDevice(request, (error, res) => {
        if (error) { console.log('Could not send command:', request, 'Error', error) }
        else { console.log('Success:', res.statusText) };
    })
}

const setDeviceConfig = (client, deviceID: string, registryID: string, projectID: string, cloudRegion: string, message: string, version) => {
    const parentName = `projects/${projectID}/locations/${cloudRegion}`;
    const registryName = `${parentName}/registries/${registryID}`;
    const binaryData = Buffer.from(message).toString('base64');
    const request = {
        name: `${registryName}/devices/${deviceID}`,
        versionToUpdate: version,
        binaryData: binaryData
    };

    client.projects.locations.registries.devices.modifyCloudToDeviceConfig(request, (error, data) => {
        if (error) { console.log('Could not update config', deviceID, 'Message', error) }
        else { console.log('Success', data) }
    })
}

const getClient = (serviceAccountJson, cb: Function) => {
    google.auth.getClient({
        keyFilename: serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    }).then(authClient => {
        const discoveryUrl = `${DISCOVERY_API}?version=${API_VERSION}`;
        google.options({ auth: authClient });
        google.discoverAPI(discoveryUrl).then(client => {
            cb(client);
        }).catch(error => console.log('Error during API discovery.', error));
    }).catch(error => console.log(error));
}

export const createUTLRegistry = (registryID: string, projectID: string, cloudRegion: string, pubsubTopic: string) => {
    console.log("createUTLRegistry")
    const cb = (client) => { lookupOrCreateRegistry(client, registryID, projectID, cloudRegion, pubsubTopic); }
    console.log("cb: ", cb)
    getClient(serviceAccount, cb);
}

export const createUTLRsaDevice = (deviceID: string, registryID: string, projectID: string, cloudRegion: string, rsaPublicKey: string) => {
    console.log("createUTLRsaDevice")
    const cb = (client) => { createRsaDevice(client, deviceID, registryID, projectID, cloudRegion, rsaPublicKey); }
    console.log("cb: ",cb)
    getClient(serviceAccount, cb);
}

export const getUTLDeviceState = (deviceID: string, registryID: string, projectID: string, cloudRegion: string) => {
    const cb = (client) => { getDeviceState(client, deviceID, registryID, projectID, cloudRegion); }
    getClient(serviceAccount, cb);
}

export const sendCommandToUTLDevice = (deviceID: string, registryID: string, projectID: string, cloudRegion: string, commandMessage: string) => {
    const cb = (client) => { sendCommand(client, deviceID, registryID, projectID, cloudRegion, commandMessage); }
    getClient(serviceAccount, cb);
}

export const setUTLDeviceConfig = (deviceID: string, registryID: string, projectID: string, cloudRegion: string, data, version) => {
    const cb = (client) => { setDeviceConfig(client, deviceID, registryID, projectID, cloudRegion, data, version); }
    getClient(serviceAccount, cb);
}

export const listUTLDevices = (registryID: string, projectID: string, cloudRegion: string) => {
    const cb = (client) => { listDevices(client, registryID, projectID, cloudRegion); }
    getClient(serviceAccount, cb);
}

export const clearUTLRegistry = (registryID: string, projectID: string, cloudRegion: string) => {
    const cb = (client) => { clearRegistry(client, registryID, projectID, cloudRegion); }
    getClient(serviceAccount, cb);
}
