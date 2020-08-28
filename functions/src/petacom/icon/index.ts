export const iconUrl = (type: string, status?: string) => {
    console.log("icon URL : ", type, status)
    let icon: string;
    switch (type) {
        case 'Node':
            switch (status) {
                case '離線':
                    icon = 'assets/Node-offline.jpg';
                    break;

                default:
                    icon = 'assets/Node.png';
                    break;
            }
            icon = 'assets/Node.png';
            break;

        case 'Router':
            switch (status) {
                case '離線':
                    icon = 'assets/Router-offline.jpg';
                    break;

                default:
                    icon = 'assets/Router.png';
                    break;
            }
            icon = 'assets/Router.png';
            break;



        case '人與物相遇 bTag':
            switch (status) {
                case 'off':
                    icon = 'assets/people.png';
                    break
                case 'on':
                    // icon = 'assets/falldown.png';
                    icon = 'assets/people.png';
                    break
                case '無移動':
                    icon = 'assets/noMove.png';
                    break
            }


        case '穿戴式感測器 bTag':
            switch (status) {
                case 'off':
                    icon = 'assets/people.png';
                    break
                case 'on':
                    // icon = 'assets/falldown.png';
                    icon = 'assets/people.png';
                    break
                case '無移動':
                    icon = 'assets/noMove.png';
                    break
                case 'falldown':
                    icon = 'assets/falldown.png';
                    break

            }

            // console.log("on:",status.search("on"))
            // console.log("off:",status.search("off"))

            // if(status.search("on")!=-1){
            //     icon = 'assets/falldown.png';
            // }else if(status.search("off")!=-1){
            //     icon = 'assets/people.png';
            // }
            break;

        case '煙霧感測器':
            switch (status) {
                case '離線':
                    icon = 'assets/Detector-offline.png';
                    break;

                case 'on':
                    // icon = 'assets/Detector-alert.png';
                    icon = 'assets/Detector-safe.png';
                    break;

                case 'off':
                    icon = 'assets/Detector-safe.png';
                    break;
            }
            break;

        case '坐墊':
            switch (status) {
                case '離線':
                    icon = 'assets/cushion-offline.png';
                    break;

                case 'on':
                    icon = 'assets/cushion-on-safe.png';
                    break;

                case 'off':
                    icon = 'assets/cushion-off-safe.png';
                    break;
            }

            // if(status.search("on")){
            //     icon = 'assets/cushion-on-safe.png';
            // }else if(status.search("off")){
            //     icon = 'assets/cushion-off-safe.png';
            // }else if(status.search("離線")){
            //     icon = 'assets/cushion-offline.png';
            // }
            break;

        case '床墊':
            switch (status) {
                case '離線':
                    icon = 'assets/mattress-offline.png';
                    break;

                case 'on':
                    icon = 'assets/mattress-on-safe.png';
                    break;

                case 'off':
                    icon = 'assets/mattress-off-safe.png';
                    break;
            }
            break;

        case '床墊（上半身）':
            icon = '';
            break;

        case '床墊（下半身）':
            icon = '';
            break;

        case '背墊':
            icon = '';
            break;

        case '踏墊':
            switch (status) {
                case '離線':
                    icon = 'assets/foot-mat-offline.png';
                    break;

                case 'on':
                    icon = 'assets/foot-mat-on-safe.png';
                    break;

                case 'off':
                    icon = 'assets/foot-mat-off-safe.png';
                    break;
            }
            break;

        case '飲水機踏墊':
            switch (status) {
                case '離線':
                    icon = 'assets/drink-offline.png';
                    break;

                case 'on':
                    icon = 'assets/drink-on.png';
                    break;

                case 'off':
                    icon = 'assets/drink-off.png';
                    break;
            }
            break;

        case '踏墊（小便斗）':
            icon = '';
            break;

        case '踏墊（淋浴間）':
            icon = '';
            break;

        case '踏墊（浴盆）':
            icon = '';
            break;

        case '踏墊（洗臉盆）':
            icon = '';
            break;

        case '大門磁簧開關':
            switch (status) {
                case '離線':
                    icon = 'assets/door-reed-switch-close-offline.png';
                    break;

                case 'on':
                    icon = 'assets/door-reed-switch-open-safe.png';
                    break;

                case 'off':
                    icon = 'assets/door-reed-switch-close-safe.png';
                    break;
            }

            // if(status.search("on")){
            //     icon = 'assets/door-reed-switch-open-safe.png';
            // }else if(status.search("off")){
            //     icon = 'assets/door-reed-switch-close-safe.png';
            // }else if(status.search("離線")){
            //     icon = 'assets/door-reed-switch-close-offline.png';
            // }
            break;

        case '窗戶':
            icon = '';
            break;

        case '櫥櫃':
            icon = '';
            break;

        case '抽屜磁簧開關':
            switch (status) {
                case '離線':
                    icon = 'assets/drawer-offline.png';
                    break;

                case 'on':
                    icon = 'assets/drawer-open-safe.png';
                    break;

                case 'off':
                    icon = 'assets/drawer-close-safe.png';
                    break;
            }

            // if(status.search("on")){
            //     icon = 'assets/drawer-open-safe.png';
            // }else if(status.search("off")){
            //     icon = 'assets/drawer-close-safe.png';
            // }else if(status.search("離線")){
            //     icon = 'assets/drawer-offline.png';
            // }
            break;

        case '冰箱門':
            icon = '';
            break;

        case '微波爐門':
            icon = '';
            break;

        case '烤箱門':
            icon = '';
            break;

        case '洗碗機門':
            icon = '';
            break;

        case '瓦斯開關':
            icon = '';
            break;

        case '水龍頭開關':
            icon = '';
            break;

        case '瓦斯爐開關':
            icon = '';
            break;

        case '溫濕度感測器':
            switch (status) {
                case 'on':
                    icon = 'assets/TemperatureAndHumiditysensor.png';
                    break;

                case 'off':
                    icon = 'assets/TemperatureAndHumiditysensor.png';
                    break;
            }
            break;

        default:
            icon = 'undefined';
            break;
    }
    console.log("final icon :", icon)
    return icon;
}
